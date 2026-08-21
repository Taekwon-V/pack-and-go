'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Camera, X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import StatePanel from '@/components/StatePanel';

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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Reduce to 800px max to ensure base64 string safely fits within 1MB Firestore limit
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert directly to base64 data URL with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

import { useTrip } from '@/components/trip/TripContext';
import { toDate } from '@/lib/tripFormatters';

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isOwner = trip?.ownerId === user?.uid;

  useEffect(() => {
    if (!tripId) return;

    const photosRef = collection(db, 'trips', tripId, 'photos');
    const photosQuery = query(photosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      photosQuery,
      (snapshot) => {
        const fetchedPhotos = snapshot.docs.map((photoDoc) => ({
          id: photoDoc.id,
          ...photoDoc.data(),
        })) as Photo[];
        setPhotos(fetchedPhotos);
        setPhotosLoading(false);
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
    
    const commentsRef = collection(db, 'trips', tripId, 'photos', selectedPhoto.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      // compressImage now returns a base64 string directly
      const base64String = await compressImage(file);
      
      // Save directly to Firestore database instead of Storage to bypass Firebase billing limits
      await addDoc(collection(db, 'trips', tripId, 'photos'), {
        url: base64String,
        uploadedBy: user.uid,
        createdAt: serverTimestamp()
      });
      
      setIsUploading(false);
    } catch (error) {
      console.error('Compression/Upload error:', error);
      setIsUploading(false);
      // Firebase document size limit is 1MB. If image is too big even after compression, it will throw an error here.
      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? error.code
        : undefined;
      if (errorCode === 'resource-exhausted') {
        alert('이미지 용량이 너무 큽니다. 다른 사진을 선택해주세요.');
      } else {
        alert('이미지 저장 중 오류가 발생했습니다.');
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !isOwner) return;
    if (!confirm('정말 이 사진을 삭제하시겠습니까?')) return;
    
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'trips', tripId, 'photos', selectedPhoto.id));
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('사진 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !selectedPhoto || !tripId) return;

    try {
      const commentsRef = collection(db, 'trips', tripId, 'photos', selectedPhoto.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || '익명',
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans relative">
      <div className="w-full">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">여행 갤러리</h1>
            <p className="text-gray-500 mt-2">소중한 순간들을 함께 나눠보세요. (최대 5장)</p>
          </div>
        </header>

        {photosLoading ? (
          <StatePanel
            variant="loading"
            title="사진을 불러오는 중입니다"
            description="여행 멤버가 공유한 순간들을 준비하고 있습니다."
          />
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
          <div className="columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="여행 사진"
                  className="w-full transform object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20">
                  <span className="rounded-full bg-black/30 px-4 py-2 font-medium tracking-wide text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    크게 보기
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Upload Button (Only for Admin & Max 5) */}
      {isOwner && photos.length < 5 && (
        <div className="fixed bottom-8 right-8 z-40">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>
        </div>
      )}

      {isUploading && (
        <div className="fixed bottom-24 right-8 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-100 text-sm font-medium text-gray-700 flex items-center gap-3 z-40">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>이미지 처리 및 업로드 중...</span>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white/10 border border-white/20 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative glassmorphism">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 md:right-auto md:left-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-2/3 h-[50vh] md:h-full bg-black/95 flex items-center justify-center relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedPhoto.url} 
                alt="Selected" 
                className="max-w-full max-h-full object-contain"
              />
              {isOwner && (
                <button 
                  onClick={handleDeletePhoto}
                  className="absolute bottom-4 right-4 z-50 p-3 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                  title="사진 삭제"
                >
                  <X className="w-5 h-5 mb-1 hidden" /> 
                  <span className="font-bold text-sm">삭제</span>
                </button>
              )}
            </div>

            {/* Comments Section */}
            <div className="w-full md:w-1/3 h-[40vh] md:h-full bg-white flex flex-col">
              <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-900">댓글</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/30">
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <p>아직 댓글이 없습니다.</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="flex flex-col space-y-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {toDate(comment.createdAt)?.toLocaleDateString('ko-KR') || ''}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm bg-gray-100/70 p-3 rounded-2xl rounded-tl-none inline-block max-w-[85%] break-words">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
                <form onSubmit={handleAddComment} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="flex-1 bg-gray-100/80 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full transition-colors flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
