// src/components/AnimatedWave/AnimatedWave.jsx
import React from 'react';
import styles from './AnimatedWave.module.scss';

const AnimatedWave = () => {
    return (
        <div className={styles.animatedWaveContainer}>
            <svg width="100%" height="100%" viewBox="0 0 1440 690" xmlns="http://www.w3.org/2000/svg" className={styles.animatedWaveSvg}>
                <defs>
                    <linearGradient id="gradient" x1="50%" y1="100%" x2="50%" y2="0%">
                        <stop offset="5%" stopColor="#fef8bc"></stop>
                        <stop offset="95%" stopColor="#fde515"></stop>
                    </linearGradient>
                </defs>
                <path
                    d="M 0,700 L 0,175 C 85.37799043062199,152.41626794258372 170.75598086124398,129.83253588516746 278,112 C 385.244019138756,94.16746411483254 514.354066985646,81.08612440191388 615,113 C 715.645933014354,144.91387559808612 787.8277511961724,221.82296650717706 870,219 C 952.1722488038276,216.17703349282294 1044.3349282296651,133.62200956937798 1141,113 C 1237.6650717703349,92.37799043062202 1338.8325358851675,133.68899521531102 1440,175 L 1440,700 L 0,700 Z"
                    stroke="none"
                    strokeWidth="0"
                    fill="url(#gradient)"
                    fillOpacity="0.53"
                    className={styles.path1}
                ></path>
                <path
                    d="M 0,700 L 0,408 C 71.76076555023923,465.5023923444976 143.52153110047846,523.0047846889952 257,488 C 370.47846889952154,452.99521531100476 525.6746411483255,325.4832535885167 622,323 C 718.3253588516745,320.5167464114833 755.7799043062201,443.0622009569378 829,459 C 902.2200956937799,474.9377990430622 1011.2057416267944,384.2679425837321 1119,358 C 1226.7942583732056,331.7320574162679 1333.3971291866028,369.86602870813397 1440,408 L 1440,700 L 0,700 Z"
                    stroke="none"
                    strokeWidth="0"
                    fill="url(#gradient)"
                    fillOpacity="1"
                    className={styles.path2}
                ></path>
            </svg>
        </div>
    );
};

export default AnimatedWave;