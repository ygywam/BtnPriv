'use client';

import React from 'react';
import { Book } from '@/lib/types';

interface BookGridProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onOpenAddModal: () => void;
  isLoading: boolean;
}

export default function BookGrid({
  books,
  onSelectBook,
  onOpenAddModal,
  isLoading,
}: BookGridProps) {
  if (isLoading && books.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="bg-white rounded-xl p-3 shadow-sm border border-stone-200 animate-pulse">
            <div className="aspect-[3/4] bg-stone-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-stone-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
        <div className="text-4xl mb-3">📖</div>
        <h3 className="text-lg font-semibold text-stone-700 mb-1">
          등록된 도서가 없습니다
        </h3>
        <p className="text-sm text-stone-500 mb-6">
          새로운 도서를 검색하고 서재에 등록해 챌린지를 시작해 보세요.
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm shadow transition"
        >
          <span>+</span> 첫 도서 등록하기
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {books.map((book) => {
        const rate = Math.min(100, Math.max(0, book.progressRate || 0));
        return (
          <div
            key={book.id}
            onClick={() => onSelectBook(book)}
            className="group bg-white rounded-2xl p-3.5 shadow-sm hover:shadow-md border border-stone-200 hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* 책 표지 */}
              <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-stone-100 relative shadow-inner">
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-amber-100 to-orange-200 text-amber-900">
                    <span className="text-2xl mb-1">📚</span>
                    <span className="text-xs font-semibold line-clamp-3">{book.title}</span>
                  </div>
                )}
                {/* 완독 뱃지 */}
                {rate >= 100 && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    완독
                  </div>
                )}
              </div>

              {/* 제목 & 저자 */}
              <h3 className="font-bold text-stone-800 text-sm line-clamp-2 mb-1 group-hover:text-amber-700 transition">
                {book.title}
              </h3>
              <p className="text-xs text-stone-500 line-clamp-1 mb-2">
                {book.author || '저자 미상'}
              </p>
            </div>

            {/* 완독률 프로그레스 바 */}
            <div className="mt-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                <span>완독률</span>
                <span className="font-semibold text-amber-700">{rate}%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${rate}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-stone-400 mt-1 text-right">
                {book.readPages || 0} / {book.totalPage || '?'} p
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
