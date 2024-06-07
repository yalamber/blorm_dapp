import React from 'react';

const Transfer = () => {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "grey" }}>
            <div style={{ padding: "10px", background: "white", borderRadius: "20px", height:"70vh",width: "25vw", margin: "0 auto", overflow: "hidden" }}>
                <iframe
                    allow="clipboard-read; clipboard-write"
                    src="https://ibc.fun/widget?src_chain=cosmoshub-4&src_asset=uatom"
                    style={{ border: "none", overflow: "hidden", borderRadius: "30px", height: "100%", width: "100%" }}
                />
            </div>
        </div>
    );
};

export default Transfer;