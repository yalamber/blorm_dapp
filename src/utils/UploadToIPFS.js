const UploadToIPFS = async (data, isMetadata = false) => {
    try {
      const formData = new FormData();
  
      if (isMetadata) {
        const blob = new Blob([data], { type: 'application/json' });
        formData.append('file', blob, 'metadata.json');
      } else {
        const blob = await fetch(data).then(res => res.blob());
        formData.append('file', blob, 'image.png');
      }
  
      const metadata = JSON.stringify({
        name: isMetadata ? "Metadata upload" : "Image upload"
      });
      formData.append('pinataMetadata', metadata);
  
      const options = JSON.stringify({
        cidVersion: 0
      });
      formData.append('pinataOptions', options);
  
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData,
      });
  
      const resData = await res.json();
      console.log("IPFS response:", resData);
      return `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS: ", error);
    }
  };
  
  export default UploadToIPFS;
  