import Swal, { SweetAlertIcon } from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export function showToast(title: string, icon: SweetAlertIcon = 'success') {
  return Toast.fire({
    icon,
    title,
  });
}

export function showSuccess(title: string, text?: string) {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#4f46e5', // Indigo
    confirmButtonText: 'ตกลง',
  });
}

export function showError(title: string, text?: string) {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ef4444', // Red
    confirmButtonText: 'ตกลง',
  });
}

export async function showConfirm(
  title: string,
  text: string,
  confirmButtonText: string = 'ยืนยัน',
  cancelButtonText: string = 'ยกเลิก',
  confirmButtonColor: string = '#ef4444'
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: '#94a3b8',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });

  return result.isConfirmed;
}

export function showLoading(title: string = 'กำลังดำเนินการ...', text?: string) {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeLoading() {
  Swal.close();
}

export default Swal;
