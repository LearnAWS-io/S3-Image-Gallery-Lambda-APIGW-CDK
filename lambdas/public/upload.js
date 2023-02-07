const form = document.getElementById("file-form");
const fileEl = document.getElementById("file");
const submitBtn = document.getElementById("submit-btn");

const fetchUploadUrl = async () => {
  const res = await fetch("/get-upload-url", { mode: "same-origin" });
  return await res.json();
};

const uploadImg = async () => {
  const res = await fetchUploadUrl();
  const formData = new FormData();
  Object.entries(res.fields).forEach((keyval) => {
    //@ts-ignore
    formData.append(...keyval);
  });

  if (fileEl.files === null || fileEl?.files?.length === 0) {
    throw Error("no file present");
  }
  const file = fileEl.files[0];
  formData.append("Content-Type", file.type);
  //make sure to append file at the end
  formData.append("file", file);

  submitBtn.setAttribute("disabled", "");
  const uploadRes = await fetch(res.url, {
    method: "POST",
    body: formData,
    mode: "cors",
  });

  console.log(uploadRes);

  if (uploadRes.status !== 204) {
    throw Error("Invalid image");
  }
  form.reset();
  window.location.reload();
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  uploadImg();
});
