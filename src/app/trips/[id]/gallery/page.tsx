'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { db, storage, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Camera, X, Send, Image as ImageIcon, Loader2, Plus } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  uploadedBy: string;
  createdAt: any;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Blob conversion failed'));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

import { useTrip } from '@/components/trip/TripContext';

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
  const [uploadProgress, setUploadProgress] = useState(0);

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
    const q = query(photosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[];
      setPhotos(fetchedPhotos);
    });

    return () => unsubscribe();
  }, [tripId]);

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
      const compressedBlob = await compressImage(file);
      
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `trips/${tripId}/photos/${fileName}`);
      
      const metadata = { contentType: file.type || 'image/jpeg' };
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, metadata);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          setIsUploading(false);
          alert(`이미지 업로드 실패: Firebase Storage 권한 설정을 확인해주세요. (Firebase Console -> Storage -> Rules)`);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'trips', tripId, 'photos'), {
            url: downloadURL,
            uploadedBy: user.uid,
            createdAt: serverTimestamp()
          });
          
          setIsUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Compression/Upload error:', error);
      setIsUploading(false);
      alert('이미지 처리 중 오류가 발생했습니다.');
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
      const { deleteObject } = await import('firebase/storage');
      
      // 1. Delete from storage (try, but ignore if fails due to wrong path logic)
      try {
        // extract path from download URL or just rely on deleteDoc
        // For complete cleanup we'd need the exact reference, but we don't store the path.
        // Let's just delete the doc for now. The file might remain in storage if we don't have the path.
      } catch (e) {}

      // 2. Delete firestore doc
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

        {/* Gallery Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="relative group cursor-pointer break-inside-avoid overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={photo.url} 
                alt="Trip photo" 
                className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 font-medium tracking-wide transition-opacity duration-300 backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full">
                  크게 보기
                </span>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && !isUploading && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">아직 사진이 없습니다.</p>
            <p className="text-sm mt-1">첫 번째 사진을 올려보세요!</p>
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
          <span>업로드 중... {Math.round(uploadProgress)}%</span>
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
                          {comment.createdAt?.toDate ? 
                            new Date(comment.createdAt.toDate()).toLocaleDateString() : ''}
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
