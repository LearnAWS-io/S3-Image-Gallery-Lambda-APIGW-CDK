import React from "react";

type Props = {
  images: string[];
};

const ImageList = ({ images }: Props) => {
  return (
    <>
      <h1>Welcome to S3 Image Gallery</h1>
      <section>
        {images.map((src) => (
          <img width="300" height="250" src={src} alt="Images from lambda" />
        ))}
      </section>
      <form id="file-form">
        <input
          type="file"
          required
          name="file"
          id="file"
          accept="image/jpg, image/png"
        />
        <button id="submit-btn" type="submit">
          upload
        </button>
      </form>
    </>
  );
};

export default ImageList;
