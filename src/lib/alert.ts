import Swal from "sweetalert2";

export function showSuccess(msg: string) {
  Swal.fire({ icon: "success", title: msg, confirmButtonColor: "#22c55e", timer: 2000, showConfirmButton: false });
}

export function showError(msg: string) {
  Swal.fire({ icon: "error", title: "Oops!", text: msg, confirmButtonColor: "#22c55e" });
}

export function showWarning(msg: string) {
  Swal.fire({ icon: "warning", title: msg, confirmButtonColor: "#22c55e", timer: 2500, showConfirmButton: false });
}

export function showInfo(msg: string) {
  Swal.fire({ icon: "info", title: msg, confirmButtonColor: "#22c55e", timer: 2500, showConfirmButton: false });
}
