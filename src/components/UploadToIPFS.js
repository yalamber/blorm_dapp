import React from "react";
import PropTypes from 'prop-types';


const UploadToIPFS = ({ base64String }) => {
  const handleUpload = async () => {
    try {
      const formData = new FormData();
      const blob = await fetch(base64String).then(res => res.blob());
      formData.append("file", blob, "image.png");

      const metadata = JSON.stringify({
        name: "Image upload"
      });
      formData.append("pinataMetadata", metadata);

      const options = JSON.stringify({
        cidVersion: 0
      });
      formData.append("pinataOptions", options);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData,
      });

      const resData = await res.json();
      console.log(resData);
    } catch (error) {
      console.error("Error uploading to IPFS: ", error);
    }
  };

  return (
    <div>
      <button onClick={handleUpload}>Upload to IPFS</button>
    </div>
  );
};

UploadToIPFS.propTypes = {
    base64String: PropTypes.string.isRequired,
  };

export default UploadToIPFS;
