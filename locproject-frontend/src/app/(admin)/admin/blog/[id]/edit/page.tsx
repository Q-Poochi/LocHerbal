'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BlogForm from '@/components/admin/blog/BlogForm';
import { useAdminBlogPosts, type AdminBlogPost } from '@/lib/hooks/useMarketing';
import { getErrorMessage } from '@/lib/utils/error';

export default function EditBlogPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { data: posts = [], isLoading, error } = useAdminBlogPosts();
    const [post, setPost] = useState<AdminBlogPost | undefined>(undefined);

    useEffect(() => {
        setPost(posts.find((p) => p.id === params.id));
    }, [posts, params.id]);

    if (isLoading) {
        return <p className="text-on-surface-variant">Đang tải...</p>;
    }

    if (error) {
        return <p className="text-error">{getErrorMessage(error, 'Không thể tải bài viết')}</p>;
    }

    if (!post) {
        return (
            <div className="text-center py-20">
                <p className="text-on-surface-variant mb-4">Không tìm thấy bài viết.</p>
                <button onClick={() => router.push('/admin/blog')} className="text-primary font-semibold">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return <BlogForm post={post} />;
}