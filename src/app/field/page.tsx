'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FieldPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/field-fast' + window.location.search);
  }, [router]);
  return null;
}
