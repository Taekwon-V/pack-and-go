'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Camera, Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import StatePanel from '@/components/StatePanel';
import { useTrip } from '@/components/trip/TripContext';
import { toDate } from '@/lib/tripFormatters';
import { auth, db } from '@/lib/firebase';

interface Photo {
  id: string;
  url: string;
  uploadedBy: string;
  createdAt: unknown;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: unknown;
}

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const image = new window.Image();
      image.src = event.target?.result as string;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 800;
        let width = image.width;
        let height = image.height;

        if (width > height && width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        } else if (height >= width && height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      image.onerror = reject;
    };
    reader.onerror = reject;
  });

export default function GalleryPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { trip } = useTrip();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [photoRetryKey, setPhotoRetryKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const isOwner = trip?.ownerId === user?.uid;

  useEffect(() => {
    if (!tripId) return;

    const photosQuery = query(collection(db, 'trips', tripId, 'photos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
        setPhotos(snapshot.docs.map((photoDoc) => ({ id: photoDoc.id, ...photoDoc.data() })) as Photo[]);
        setPhotosLoading(false);
        setPhotosError(null);
      },
      (snapshotError) => {
        console.error('Error fetching gallery photos:', snapshotError);
        setPhotosLoading(false);
        setPhotosError('사진을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      },
    );

    return () => unsubscribe();
  }, [photoRetryKey, tripId]);

  useEffect(() => {
    if (!selectedPhoto || !tripId) return;

    const commentsQuery = query(
      collection(db, 'trips', tripId, 'photos', selectedPhoto.id, 'comments'),
      orderBy('createdAt', 'asc'),
    );
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setComments(snapshot.docs.map((commentDoc) => ({ id: commentDoc.id, ...commentDoc.data() })) as Comment[]);
      window.setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [selectedPhoto, tripId]);

  const handleUploadClick = () => {
    if (!isOwner) {
      alert('방장(관리자)만 사진을 업로드할 수 있습니다.');
      return;
    }
    if (photos.length >= 5) {
      alert('사진은 최대 5장까지만 업로드 가능합니다.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !tripId) return;

    if (!isOwner) {
      alert('방장(관리자)만 사진을 업로드할 수 있습니다.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (photos.length >= 5) {
      alert('사진은 최대 5장까지만 업로드 가능합니다.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const base64String = await compressImage(file);
      await addDoc(collection(db, 'trips', tripId, 'photos'), {
        url: base64String,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Compression/Upload error:', error);
      const errorCode = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
      alert(errorCode === 'resource-exhausted' ? '이미지 용량이 너무 큽니다. 다른 사진을 선택해주세요.' : '이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !isOwner) return;
    if (!confirm('정말 이 사진을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'trips', tripId, 'photos', selectedPhoto.id));
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('사진 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newComment.trim() || !user || !selectedPhoto || !tripId) return;

    try {
      await addDoc(collection(db, 'trips', tripId, 'photos', selectedPhoto.id, 'comments'), {
        text: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || '익명',
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  return (
    <section className="editorial-section !pt-0" aria-labelledby="gallery-title">
      <div className="editorial-section-heading">
        <div>
          <p className="editorial-kicker">Gallery</p>
          <h1 id="gallery-title" className="editorial-display mt-4 text-[clamp(1.95rem,4vw,3.35rem)] leading-[1.03]">장면을 모으는 곳.</h1>
        </div>
        <p className="hidden max-w-[18ch] text-right text-[0.62rem] font-bold uppercase leading-[1.7] tracking-[0.15em] text-[var(--muted)] sm:block">
          Shared field images<br />Up to 5 photographs
        </p>
      </div>

      <div className="mt-5">
        {photosLoading ? (
          <StatePanel variant="loading" title="사진을 불러오는 중입니다" description="여행 멤버가 공유한 순간들을 준비하고 있습니다." />
        ) : photosError ? (
          <StatePanel
            variant="error"
            title="갤러리를 불러오지 못했습니다"
            description={photosError}
            actionLabel="다시 시도"
            onAction={() => {
              setPhotos([]);
              setPhotosLoading(true);
              setPhotosError(null);
              setPhotoRetryKey((currentKey) => currentKey + 1);
            }}
          />
        ) : photos.length === 0 ? (
          <StatePanel
            variant="empty"
            icon={ImageIcon}
            title="아직 사진이 없습니다"
            description="방장이 첫 번째 여행 사진을 올리면 이곳에서 함께 확인할 수 있습니다."
          />
        ) : (
          <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                className="editorial-focus group relative mb-5 block w-full break-inside-avoid overflow-hidden border-0 bg-[var(--sand)] p-0 text-left"
                onClick={() => setSelectedPhoto(photo)}
                aria-label={`여행 사진 ${index + 1} 크게 보기`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`여행 공유 사진 ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="block w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-12 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Open field note
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isOwner && photos.length < 5 && (
        <div className="editorial-upload">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <button type="button" onClick={handleUploadClick} disabled={isUploading} className="editorial-upload-button editorial-focus disabled:cursor-not-allowed disabled:opacity-50">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
            {isUploading ? 'Uploading' : 'Add photo'}
          </button>
        </div>
      )}

      {isUploading && <div className="editorial-upload-status"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin text-[var(--terra)]" aria-hidden="true" /> 이미지 처리 및 업로드 중...</div>}

      {selectedPhoto && (
        <div className="editorial-lightbox p-0" role="dialog" aria-modal="true" aria-label="여행 사진과 댓글">
          <div className="relative flex h-full max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden border border-white/20 bg-[var(--paper)] md:flex-row">
            <button type="button" onClick={() => setSelectedPhoto(null)} className="editorial-lightbox-close editorial-focus" aria-label="사진 닫기">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="relative flex min-h-[42dvh] w-full items-center justify-center bg-[var(--ink)] md:h-full md:w-2/3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedPhoto.url} alt="선택한 여행 사진" className="max-h-full max-w-full object-contain" />
              {isOwner && <button type="button" onClick={handleDeletePhoto} className="editorial-button absolute bottom-4 right-4 !border-[var(--terra)] !bg-[var(--terra)] editorial-focus">Delete</button>}
            </div>
            <div className="flex min-h-[42dvh] w-full flex-col bg-[var(--paper)] md:h-full md:w-1/3">
              <div className="border-b border-[var(--rule)] p-5">
                <p className="editorial-kicker">Conversation</p>
                <h2 className="editorial-display mt-3 text-2xl">댓글</h2>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {comments.length === 0 ? (
                  <p className="py-8 text-center text-[0.78rem] text-[var(--muted)]">아직 댓글이 없습니다.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[0.75rem] font-extrabold">{comment.authorName}</span>
                        <span className="text-[0.62rem] text-[var(--muted)]">{toDate(comment.createdAt)?.toLocaleDateString('ko-KR') || ''}</span>
                      </div>
                      <p className="mt-2 border-l-2 border-[var(--terra)] pl-3 text-[0.78rem] leading-[1.7] text-[var(--muted)]">{comment.text}</p>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
              <form onSubmit={handleAddComment} className="border-t border-[var(--rule)] p-4">
                <label htmlFor="gallery-comment" className="sr-only">댓글 입력</label>
                <div className="flex items-center gap-2">
                  <input id="gallery-comment" type="text" value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="댓글을 입력하세요..." className="editorial-input" />
                  <button type="submit" disabled={!newComment.trim()} className="editorial-button editorial-focus !min-h-[2.75rem] !px-3 disabled:cursor-not-allowed disabled:opacity-45" aria-label="댓글 보내기">
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
