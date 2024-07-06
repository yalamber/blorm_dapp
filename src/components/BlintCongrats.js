import React from 'react';
import styles from '../styles/BlintCongrats.module.css';
import logo from '../images/logo.png';
import NftCard from './NftCard'; // Import the NftCard component
import { Link } from 'react-router-dom';

const BlintCongrats = ({ txHash, tokenId, openseaURL, nft, blintAgainClicked }) => {
    console.log('BlintCongrats:', { txHash, tokenId, openseaURL, nft });

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    return (
        <div>
            {isMobile ? (
                // Mobile version
                <div className={styles.mobileContainer}>
                    <div className={styles.mobileCenterContainer}>
                        <h1 className={styles.mobileTitle}>Congrats On Blinting</h1>
                        <div className={styles.mobileBlintImageContainer}>
                            {nft && nft.tokenId && <NftCard nft={nft} width={'100%'} />}
                        </div>
                        <p className={styles.mobileSubtitle}>
                            Your opepen is ready for life. <br />
                            Continue your onchain journey. <br />
                            This is only one blorm of many to come.
                        </p>
                        <div className={styles.mobileCallToAction}>
                            <Link className={styles.mobileActionButtonContainer} to="/profile">
                                <button className={styles.mobileActionButton}> See Profile → </button>
                            </Link>
                            <div className={styles.mobileActionButtonContainer}>
                                <button className={styles.mobileActionButton} onClick={blintAgainClicked}> Blint Again → </button>
                            </div>
                            <img src={logo} className={styles.mobileCallToActionLogo}></img>
                        </div>
                    </div>
                </div>
            ) : (
                // Desktop version
                <div className={styles.container}>
                    <div className={styles.centerContainer}>
                        <div className={styles.leftPanel}>
                            {/* Render NftCard only if nft and nft.tokenId are available */}
                            <div className={styles.blintImageContainer}>
                                {nft && nft.tokenId && <NftCard nft={nft} width={'100%'} />}
                            </div>
                        </div>
                        <div className={styles.rightPanel}>
                            <h1 className={styles.title}>Congrats On Blinting</h1>
                            <p className={styles.subtitle}>
                                Your opepen is ready for life. <br />
                                Continue your onchain journey. <br />
                                This is only one blorm of many to come.
                            </p>
                            <div className={styles.callToAction}>
                                <Link className={styles.actionButtonContainer} to="/profile">
                                    <button className={styles.actionButton}> See Profile → </button>
                                </Link>
                                <div className={styles.actionButtonContainer}>
                                    <button className={styles.actionButton} onClick={blintAgainClicked}> Blint Again → </button>
                                </div>
                                <img src={logo} className={styles.callToActionLogo}></img>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BlintCongrats;
