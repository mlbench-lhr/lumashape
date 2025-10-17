'use client';

import DesignLayout from '@/components/Workspace/DesignLayout/DesignLayout';
import React from 'react';

function Page() {
  React.useEffect(() => {
    // Ensure new layouts don’t accidentally use edit mode
    try {
      sessionStorage.removeItem('editingLayoutId');
    } catch {}
  }, []);

  return <DesignLayout />;
}

export default Page;
