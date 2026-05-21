export const getRoleBadge = (role: string) => {
  switch (role) {
    case 'user':
      return '👤 مقيم';
    case 'provider':
      return '🏪 صاحب خدمة';
    case 'admin':
      return '🔧 مدير';
    default:
      return '';
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return { text: 'معتمد', bg: '#D1FAE5', color: '#065F46' };
    case 'pending':
      return { text: 'قيد المراجعة', bg: '#FEF3C7', color: '#92400E' };
    case 'rejected':
      return { text: 'مرفوض', bg: '#FEE2E2', color: '#991B1B' };
    default:
      return { text: status, bg: '#F3F4F6', color: '#374151' };
  }
};
