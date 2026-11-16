import type { ReactNode } from "react";

type StitchWildlifeSceneProps = {
  children?: ReactNode;
  action?: ReactNode;
};

export default function StitchWildlifeScene({
  children,
  action,
}: StitchWildlifeSceneProps) {
  return (
    <div className='w-full relative flex flex-col items-center justify-between overflow-hidden pt-4 sm:pt-9 pb-0'>
      <div className='absolute inset-0 pointer-events-none overflow-hidden z-0'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-b from-[#d4af37]/12 via-[#184a2f]/25 to-transparent blur-[110px] rounded-full'></div>
        <div className='absolute top-1/4 -left-32 w-80 h-80 bg-[#2d6e4b]/20 blur-[120px] rounded-full'></div>
        <div className='absolute top-1/3 -right-32 w-80 h-80 bg-[#d4af37]/15 blur-[130px] rounded-full'></div>
      </div>
      <div className='absolute top-4 sm:top-6 left-0 w-full pointer-events-none z-10'>
        <div className='bird-flock-1 absolute flex items-center gap-2 sm:gap-3'>
          <svg className='w-4 sm:w-5 h-3.5 sm:h-4 text-[#d4af37]/80 anim-wing' fill='currentColor' viewBox='0 0 24 16'>
            <path d='M1 9 C 7 3, 11 8, 12 11 C 13 8, 17 3, 23 9 C 18 10, 14 14, 12 16 C 10 14, 6 10, 1 9 Z'></path>
          </svg>
          <svg className='w-3 sm:w-3.5 h-2.5 sm:h-3 text-[#d4af37]/60 anim-wing -mt-1 sm:-mt-2' fill='currentColor' style={{ animationDelay: '0.15s' }} viewBox='0 0 24 16'>
            <path d='M1 9 C 7 3, 11 8, 12 11 C 13 8, 17 3, 23 9 C 18 10, 14 14, 12 16 C 10 14, 6 10, 1 9 Z'></path>
          </svg>
          <svg className='w-3.5 sm:w-4 h-3 sm:h-3.5 text-[#d4af37]/70 anim-wing mt-1 sm:mt-2' fill='currentColor' style={{ animationDelay: '0.3s' }} viewBox='0 0 24 16'>
            <path d='M1 9 C 7 3, 11 8, 12 11 C 13 8, 17 3, 23 9 C 18 10, 14 14, 12 16 C 10 14, 6 10, 1 9 Z'></path>
          </svg>
        </div>
        <div className='bird-flock-2 absolute top-6 sm:top-8 flex items-center gap-3 sm:gap-4'>
          <svg className='w-3.5 sm:w-4 h-3 sm:h-3.5 text-emerald-200/50 anim-wing' fill='currentColor' viewBox='0 0 24 16'>
            <path d='M1 9 C 7 3, 11 8, 12 11 C 13 8, 17 3, 23 9 C 18 10, 14 14, 12 16 C 10 14, 6 10, 1 9 Z'></path>
          </svg>
          <svg className='w-2.5 sm:w-3 h-2 sm:h-2.5 text-emerald-200/40 anim-wing mt-1' fill='currentColor' style={{ animationDelay: '0.2s' }} viewBox='0 0 24 16'>
            <path d='M1 9 C 7 3, 11 8, 12 11 C 13 8, 17 3, 23 9 C 18 10, 14 14, 12 16 C 10 14, 6 10, 1 9 Z'></path>
          </svg>
        </div>
      </div>
      <svg className='absolute top-0 left-0 w-full h-32 sm:h-48 pointer-events-none z-10 text-[#0a1e14]' fill='currentColor' preserveAspectRatio='none' viewBox='0 0 1440 200'>
        <path d='M-30 -10 C 220 30, 300 120, 460 75 C 540 50, 610 85, 660 60 C 580 25, 420 8, -30 -10 Z' opacity='0.95'></path>
        <path d='M1470 -10 C 1220 40, 1120 110, 920 70 C 850 55, 800 75, 750 60 C 890 18, 1050 5, 1470 -10 Z' opacity='0.95'></path>
        <path d='M130 35 Q 145 110 140 160 M165 25 Q 175 90 170 130 M320 60 Q 335 130 325 180 M1040 55 Q 1030 130 1038 170 M1190 45 Q 1200 120 1195 185' fill='none' stroke='#1b452e' strokeLinecap='round' strokeWidth='2.5'></path>
      </svg>
      <div className='absolute top-4 sm:top-10 left-2 sm:left-12 lg:left-20 z-20 anim-monkey-swing pointer-events-none'>
        <svg className='w-11 sm:w-18 lg:w-20 h-22 sm:h-36 overflow-visible' viewBox='0 0 80 120'>
          <path d='M40 0 C 42 26, 38 48, 40 62' fill='none' stroke='#255236' strokeWidth='3'></path>
          <ellipse cx='40' cy='82' fill='#8d623d' rx='13' ry='17'></ellipse>
          <ellipse cx='40' cy='84' fill='#b88c60' rx='8' ry='12'></ellipse>
          <path d='M33 74 Q 38 54 40 46' fill='none' stroke='#8d623d' strokeLinecap='round' strokeWidth='4'></path>
          <path d='M47 74 Q 42 54 40 46' fill='none' stroke='#7a5433' strokeLinecap='round' strokeWidth='3.5'></path>
          <circle cx='40' cy='66' fill='#8d623d' r='10'></circle>
          <circle cx='40' cy='67' fill='#d9b691' r='7.5'></circle>
          <circle cx='31' cy='66' fill='#d9b691' r='3.2'></circle>
          <circle cx='49' cy='66' fill='#d9b691' r='3.2'></circle>
          <circle className='anim-blink' cx='37' cy='65' fill='#1b120c' r='1.4'></circle>
          <circle className='anim-blink' cx='43' cy='65' fill='#1b120c' r='1.4'></circle>
          <path d='M37 70 Q 40 72 43 70' fill='none' stroke='#4a2e16' strokeWidth='1.2'></path>
          <path d='M42 98 C 55 109, 57 88, 48 82' fill='none' stroke='#8d623d' strokeLinecap='round' strokeWidth='3.5'></path>
        </svg>
      </div>
      {children}
      <div className='w-full relative z-20 flex flex-col items-center justify-end mt-1 sm:mt-6'>
        <div className='w-full max-w-7xl px-1 sm:px-6 relative min-h-[160px] sm:min-h-[300px] lg:min-h-[330px] flex items-end justify-center'>
          <div className='absolute bottom-1 left-0 sm:left-4 lg:left-8 z-20 pointer-events-none'>
            <svg className='w-13 sm:w-28 lg:w-32 h-14 sm:h-28' style={{ width: 'min(15vw, 128px)', height: 'auto' }} viewBox='0 0 110 90'>
              <ellipse cx='50' cy='85' fill='#030906' opacity='0.4' rx='32' ry='4'></ellipse>
              <line stroke='#8a532d' strokeLinecap='round' strokeWidth='3' x1='28' x2='25' y1='52' y2='82'></line>
              <line stroke='#6e3e1e' strokeLinecap='round' strokeWidth='2.8' x1='38' x2='35' y1='52' y2='82'></line>
              <line stroke='#8a532d' strokeLinecap='round' strokeWidth='3' x1='68' x2='68' y1='50' y2='82'></line>
              <line stroke='#6e3e1e' strokeLinecap='round' strokeWidth='2.8' x1='78' x2='76' y1='50' y2='82'></line>
              <ellipse cx='52' cy='50' fill='#a46336' rx='25' ry='15'></ellipse>
              <ellipse cx='50' cy='54' fill='#f0dfcf' opacity='0.6' rx='19' ry='9'></ellipse>
              <circle cx='44' cy='46' fill='#ffffff' opacity='0.8' r='1.4'></circle>
              <circle cx='52' cy='44' fill='#ffffff' opacity='0.8' r='1.4'></circle>
              <circle cx='58' cy='48' fill='#ffffff' opacity='0.8' r='1.4'></circle>
              <circle cx='64' cy='45' fill='#ffffff' opacity='0.8' r='1.4'></circle>
              <circle cx='48' cy='52' fill='#ffffff' opacity='0.8' r='1.2'></circle>
              <g className='anim-deer-head'>
                <path d='M30 46 C 26 36, 20 28, 16 26' stroke='#a46336' strokeLinecap='round' strokeWidth='8'></path>
                <polygon fill='#a46336' points='18,24 8,28 14,35'></polygon>
                <ellipse cx='21' cy='22' fill='#8a532d' rx='5' ry='2.2' transform='rotate(-30 21 22)'></ellipse>
                <circle className='anim-blink' cx='15' cy='28' fill='#1b120c' r='1.5'></circle>
                <ellipse cx='8' cy='28' fill='#2d170a' rx='1.8' ry='1.8'></ellipse>
                <path d='M19 22 L 19 8 M19 14 L 14 10 M19 11 L 23 7' fill='none' stroke='#d9be9b' strokeLinecap='round' strokeWidth='1.6'></path>
              </g>
              <path d='M78 48 Q 84 52 82 58' fill='none' stroke='#a46336' strokeLinecap='round' strokeWidth='2.5'></path>
            </svg>
          </div>
          <div className='absolute bottom-1 left-[14%] sm:left-[17%] lg:left-[18%] z-10 pointer-events-none'>
            <svg className='w-18 sm:w-40 lg:w-48 h-18 sm:h-36' style={{ width: 'min(20vw, 190px)', height: 'auto' }} viewBox='0 0 160 130'>
              <ellipse cx='80' cy='120' fill='#030906' opacity='0.4' rx='50' ry='7'></ellipse>
              <rect fill='#4d5a57' height='44' rx='4' width='13' x='42' y='72'></rect>
              <rect fill='#4d5a57' height='44' rx='4' width='13' x='100' y='72'></rect>
              <ellipse cx='76' cy='68' fill='#697a76' rx='40' ry='32'></ellipse>
              <rect fill='#758883' height='44' rx='5' width='15' x='56' y='74'></rect>
              <rect fill='#758883' height='44' rx='5' width='15' x='88' y='74'></rect>
              <path d='M116 68 Q 124 82 120 102' fill='none' stroke='#5d6e6a' strokeLinecap='round' strokeWidth='2.5'></path>
              <circle cx='44' cy='50' fill='#697a76' r='22'></circle>
              <circle className='anim-blink' cx='36' cy='46' fill='#1b2421' r='2'></circle>
              <path d='M34 66 Q 26 73 19 68' fill='none' stroke='#fffae6' strokeLinecap='round' strokeWidth='3.5'></path>
              <ellipse className='anim-ear' cx='54' cy='50' fill='#5c6e69' rx='13' ry='17'></ellipse>
              <g className='anim-trunk'>
                <path d='M30 58 C 26 72, 14 79, 20 93 C 24 102, 33 98, 31 90' fill='none' stroke='#697a76' strokeLinecap='round' strokeWidth='7.5'></path>
              </g>
            </svg>
          </div>
          <div className='relative z-30 flex items-end justify-center gap-1 sm:gap-4 md:gap-5 pb-0.5'>
            <div className='anim-breath flex flex-col items-center'>
              <div className='relative w-6 sm:w-12 lg:w-13 h-16 sm:h-30 lg:h-32'>
                <svg className='w-full h-full overflow-visible' viewBox='0 0 50 120'>
                  <rect fill='#2d4234' height='20' rx='3' width='9' x='2' y='34'></rect>
                  <line stroke='#7b684c' strokeLinecap='round' strokeWidth='5' x1='16' x2='15' y1='68' y2='114'></line>
                  <line stroke='#7b684c' strokeLinecap='round' strokeWidth='5' x1='25' x2='27' y1='68' y2='114'></line>
                  <rect fill='#1e150f' height='5' rx='1.5' width='8' x='11' y='110'></rect>
                  <rect fill='#1e150f' height='5' rx='1.5' width='8' x='24' y='110'></rect>
                  <rect fill='#e0dad0' height='32' rx='4' width='16' x='13' y='38'></rect>
                  <g className='anim-wave'>
                    <path d='M26 40 Q 36 30 35 14' fill='none' stroke='#b0845a' strokeLinecap='round' strokeWidth='3.8'></path>
                    <circle cx='35' cy='12' fill='#b0845a' r='2.5'></circle>
                  </g>
                  <g className='anim-nod'>
                    <circle cx='21' cy='25' fill='#c49a6c' r='8'></circle>
                    <path d='M13 23 C 13 14, 29 14, 29 23 C 26 18, 16 18, 13 23 Z' fill='#201a15'></path>
                    <circle className='anim-blink' cx='24' cy='25' fill='#1b120c' r='1.1'></circle>
                    <path d='M22 29 Q 25 31 27 29' fill='none' stroke='#4a2e16' strokeWidth='1.1'></path>
                  </g>
                </svg>
              </div>
            </div>
            <div className='anim-breath flex flex-col items-center' style={{ animationDelay: '0.8s' }}>
              <div className='relative w-5 sm:w-11 lg:w-12 h-14 sm:h-28 lg:h-30'>
                <svg className='w-full h-full overflow-visible' viewBox='0 0 46 115'>
                  <line stroke='#354e60' strokeLinecap='round' strokeWidth='4.8' x1='14' x2='13' y1='64' y2='108'></line>
                  <line stroke='#354e60' strokeLinecap='round' strokeWidth='4.8' x1='22' x2='24' y1='64' y2='108'></line>
                  <rect fill='#d6d1c8' height='4' rx='1.5' width='7' x='9' y='104'></rect>
                  <rect fill='#d6d1c8' height='4' rx='1.5' width='7' x='21' y='104'></rect>
                  <rect fill='#d4af37' height='28' rx='3.5' width='14' x='11' y='38'></rect>
                  <path d='M14 40 Q 18 50 22 40' fill='none' stroke='#251a00' strokeWidth='1.2'></path>
                  <path d='M11 40 Q 7 50 12 56' fill='none' stroke='#bf8f63' strokeLinecap='round' strokeWidth='3.2'></path>
                  <path d='M25 40 Q 24 50 18 52' fill='none' stroke='#bf8f63' strokeLinecap='round' strokeWidth='3.2'></path>
                  <g className='anim-nod'>
                    <path d='M9 22 C 9 32, 12 42, 12 45 C 16 45, 27 43, 27 28 C 27 15, 9 15, 9 22 Z' fill='#2b1c11'></path>
                    <circle cx='18' cy='24' fill='#cda277' r='7'></circle>
                    <circle className='anim-blink' cx='20' cy='24' fill='#1b120c' r='1.1'></circle>
                    <path d='M19 28 Q 21 30 23 28' fill='none' stroke='#5a3318' strokeWidth='1.1'></path>
                  </g>
                </svg>
              </div>
            </div>
            <div className='anim-breath flex flex-col items-center' style={{ animationDelay: '1.4s' }}>
              <div className='relative w-6 sm:w-13 lg:w-14 h-16 sm:h-31 lg:h-34'>
                <svg className='w-full h-full overflow-visible' viewBox='0 0 52 125'>
                  <line stroke='#41543e' strokeLinecap='round' strokeWidth='5.2' x1='16' x2='14' y1='70' y2='118'></line>
                  <line stroke='#41543e' strokeLinecap='round' strokeWidth='5.2' x1='25' x2='28' y1='70' y2='118'></line>
                  <rect fill='#281e15' height='5' rx='1.5' width='8' x='10' y='114'></rect>
                  <rect fill='#281e15' height='5' rx='1.5' width='8' x='25' y='114'></rect>
                  <rect fill='#a85d43' height='34' rx='4' width='16' x='13' y='38'></rect>
                  <path d='M26 42 L 38 34 L 43 32' fill='none' stroke='#ad7d52' strokeLinecap='round' strokeWidth='3.6'></path>
                  <circle cx='44' cy='31' fill='#ad7d52' r='2'></circle>
                  <path d='M13 42 Q 8 50 12 58' fill='none' stroke='#ad7d52' strokeLinecap='round' strokeWidth='3.2'></path>
                  <g className='anim-nod'>
                    <circle cx='21' cy='24' fill='#bd8e61' r='7.5'></circle>
                    <path d='M13 22 C 13 14, 29 14, 29 22 C 25 17, 16 17, 13 22 Z' fill='#1f1813'></path>
                    <circle className='anim-blink' cx='24' cy='24' fill='#1b120c' r='1.1'></circle>
                    <path d='M23 28 Q 25 30 27 28' fill='none' stroke='#4a2e16' strokeWidth='1.1'></path>
                  </g>
                </svg>
              </div>
            </div>
            <div className='anim-breath flex flex-col items-center' style={{ animationDelay: '2.1s' }}>
              <div className='relative w-5 sm:w-11 lg:w-12 h-14 sm:h-28 lg:h-30'>
                <svg className='w-full h-full overflow-visible' viewBox='0 0 46 115'>
                  <line stroke='#8b7b64' strokeLinecap='round' strokeWidth='4.8' x1='14' x2='13' y1='64' y2='108'></line>
                  <line stroke='#8b7b64' strokeLinecap='round' strokeWidth='4.8' x1='22' x2='24' y1='64' y2='108'></line>
                  <rect fill='#312217' height='4' rx='1.5' width='7' x='9' y='104'></rect>
                  <rect fill='#312217' height='4' rx='1.5' width='7' x='21' y='104'></rect>
                  <rect fill='#2d6148' height='28' rx='3.5' width='14' x='11' y='38'></rect>
                  <rect fill='#f4ebd9' height='10' rx='1.2' stroke='#9e7b4a' strokeWidth='1.2' width='8' x='17' y='46'></rect>
                  <path d='M11 42 Q 13 50 17 52' fill='none' stroke='#c99c72' strokeLinecap='round' strokeWidth='3'></path>
                  <path d='M25 42 Q 22 50 20 54' fill='none' stroke='#c99c72' strokeLinecap='round' strokeWidth='3'></path>
                  <g className='anim-nod'>
                    <circle cx='18' cy='24' fill='#c99c72' r='7'></circle>
                    <path d='M11 22 C 11 15, 25 15, 25 22 C 23 17, 13 17, 11 22 Z' fill='#1b120c'></path>
                    <path d='M11 23 Q 8 33 10 40' fill='none' stroke='#1b120c' strokeLinecap='round' strokeWidth='2.5'></path>
                    <circle className='anim-blink' cx='20' cy='24' fill='#1b120c' r='1.1'></circle>
                    <path d='M19 28 Q 21 30 22 28' fill='none' stroke='#5a3318' strokeWidth='1.1'></path>
                  </g>
                </svg>
              </div>
            </div>
            <div className='hidden sm:flex anim-breath flex-col items-center' style={{ animationDelay: '2.7s' }}>
              <div className='relative w-8 sm:w-12 lg:w-13 h-22 sm:h-30 lg:h-32'>
                <svg className='w-full h-full overflow-visible' viewBox='0 0 50 120'>
                  <line stroke='#2e3633' strokeLinecap='round' strokeWidth='5' x1='16' x2='15' y1='68' y2='114'></line>
                  <line stroke='#2e3633' strokeLinecap='round' strokeWidth='5' x1='25' x2='26' y1='68' y2='114'></line>
                  <rect fill='#1e1812' height='5' rx='1.5' width='8' x='11' y='110'></rect>
                  <rect fill='#1e1812' height='5' rx='1.5' width='8' x='23' y='110'></rect>
                  <rect fill='#2a3d52' height='32' rx='4' width='16' x='13' y='38'></rect>
                  <line stroke='#d5dfd8' strokeWidth='2' x1='21' x2='21' y1='38' y2='52'></line>
                  <path d='M13 40 Q 16 48 16 56' fill='none' stroke='#b0845a' strokeLinecap='round' strokeWidth='3.5'></path>
                  <path d='M27 40 Q 24 48 24 56' fill='none' stroke='#b0845a' strokeLinecap='round' strokeWidth='3.5'></path>
                  <g className='anim-nod'>
                    <circle cx='21' cy='25' fill='#bd8f64' r='7.5'></circle>
                    <path d='M13 22 C 13 15, 29 15, 29 22 L 33 23 L 29 24 Z' fill='#36493c'></path>
                    <circle className='anim-blink' cx='24' cy='25' fill='#1b120c' r='1.1'></circle>
                    <path d='M22 29 Q 25 31 27 29' fill='none' stroke='#4a2e16' strokeWidth='1.1'></path>
                  </g>
                </svg>
              </div>
            </div>
            <div className='hidden sm:flex anim-breath flex-col items-center' style={{ animationDelay: '1.1s' }}>
              <div className='relative w-8 sm:w-11 lg:w-12 h-21 sm:h-29 lg:h-31'>
                <svg className='w-full h-full overflow-visible' viewBox='0 0 48 116'>
                  <line stroke='#3e4a42' strokeLinecap='round' strokeWidth='4.8' x1='14' x2='13' y1='66' y2='110'></line>
                  <line stroke='#3e4a42' strokeLinecap='round' strokeWidth='4.8' x1='22' x2='24' y1='66' y2='110'></line>
                  <rect fill='#241912' height='4' rx='1.5' width='7' x='9' y='106'></rect>
                  <rect fill='#241912' height='4' rx='1.5' width='7' x='21' y='106'></rect>
                  <rect fill='#577868' height='30' rx='3.5' width='15' x='11' y='38'></rect>
                  <path d='M11 42 Q 8 50 13 56' fill='none' stroke='#c49a6c' strokeLinecap='round' strokeWidth='3'></path>
                  <path d='M26 42 Q 28 50 22 54' fill='none' stroke='#c49a6c' strokeLinecap='round' strokeWidth='3'></path>
                  <g className='anim-nod'>
                    <circle cx='19' cy='24' fill='#c49a6c' r='7'></circle>
                    <path d='M12 23 C 12 15, 26 15, 26 23 C 24 18, 15 18, 12 23 Z' fill='#291a10'></path>
                    <circle className='anim-blink' cx='21' cy='24' fill='#1b120c' r='1.1'></circle>
                    <path d='M20 28 Q 22 30 24 28' fill='none' stroke='#4a2e16' strokeWidth='1.1'></path>
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <div className='absolute bottom-1 right-[14%] sm:right-[16%] lg:right-[17%] z-10 pointer-events-none'>
            <svg className='w-16 sm:w-32 lg:w-40 h-32 sm:h-64 lg:h-72' style={{ width: 'min(18vw, 160px)', height: 'auto' }} viewBox='0 0 100 180'>
              <ellipse cx='48' cy='172' fill='#030906' opacity='0.4' rx='26' ry='4'></ellipse>
              <line stroke='#a2723c' strokeLinecap='round' strokeWidth='3.8' x1='38' x2='35' y1='120' y2='172'></line>
              <line stroke='#875c2e' strokeLinecap='round' strokeWidth='3.2' x1='48' x2='45' y1='120' y2='172'></line>
              <line stroke='#a2723c' strokeLinecap='round' strokeWidth='3.8' x1='68' x2='68' y1='120' y2='172'></line>
              <line stroke='#875c2e' strokeLinecap='round' strokeWidth='3.2' x1='76' x2='74' y1='120' y2='172'></line>
              <path d='M32 105 Q 55 92 78 112 Q 78 128 55 128 Q 32 125 32 105 Z' fill='#cf9957'></path>
              <rect fill='#75471d' height='7' rx='1.5' width='7' x='42' y='103'></rect>
              <rect fill='#75471d' height='6' rx='1.5' width='8' x='56' y='107'></rect>
              <rect fill='#75471d' height='5' rx='1.5' width='6' x='66' y='113'></rect>
              <g className='anim-giraffe-neck'>
                <path d='M42 108 L 28 26' stroke='#cf9957' strokeLinecap='round' strokeWidth='11'></path>
                <rect fill='#75471d' height='8' rx='1.5' width='6' x='36' y='90'></rect>
                <rect fill='#75471d' height='7' rx='1.5' width='6' x='33' y='72'></rect>
                <rect fill='#75471d' height='7' rx='1.5' width='5' x='30' y='54'></rect>
                <rect fill='#75471d' height='6' rx='1.5' width='5' x='27' y='38'></rect>
                <polygon fill='#cf9957' points='26,26 12,20 20,12 30,18'></polygon>
                <circle className='anim-blink' cx='18' cy='18' fill='#24150b' r='1.8'></circle>
                <line stroke='#75471d' strokeLinecap='round' strokeWidth='2' x1='23' x2='20' y1='13' y2='5'></line>
                <circle cx='20' cy='5' fill='#4d2c0e' r='1.8'></circle>
                <ellipse className='anim-ear-twitch' cx='29' cy='15' fill='#cf9957' rx='4.5' ry='1.8' transform='rotate(20 29 15)'></ellipse>
                <circle cx='12' cy='20' fill='#8a5e33' r='2.5'></circle>
                <path d='M10 22 Q 4 23 2 18 Q 8 18 10 22' fill='#489e5a'></path>
              </g>
              <path d='M78 116 Q 86 132 82 144' fill='none' stroke='#a2723c' strokeLinecap='round' strokeWidth='2'></path>
              <circle cx='82' cy='144' fill='#4d2c0e' r='2.5'></circle>
            </svg>
          </div>
          <div className='absolute bottom-1 right-0 sm:right-4 lg:right-8 z-20 pointer-events-none'>
            <svg className='w-13 sm:w-28 lg:w-34 h-13 sm:h-26' style={{ width: 'min(15vw, 136px)', height: 'auto' }} viewBox='0 0 120 90'>
              <ellipse cx='60' cy='84' fill='#030906' opacity='0.4' rx='36' ry='4'></ellipse>
              <g className='anim-zebra-tail'>
                <path d='M96 46 Q 104 56 102 68' fill='none' stroke='#161b18' strokeLinecap='round' strokeWidth='2.5'></path>
                <circle cx='102' cy='69' fill='#0d110f' r='2'></circle>
              </g>
              <g className='anim-zebra-step'>
                <line stroke='#f2f5f3' strokeLinecap='round' strokeWidth='3.8' x1='38' x2='35' y1='52' y2='82'></line>
                <line stroke='#161b18' strokeWidth='2.5' x1='38' x2='35' y1='58' y2='60'></line>
                <line stroke='#161b18' strokeWidth='2.5' x1='37' x2='34' y1='68' y2='70'></line>
              </g>
              <line stroke='#d5dbd7' strokeLinecap='round' strokeWidth='3.5' x1='48' x2='48' y1='52' y2='82'></line>
              <line stroke='#f2f5f3' strokeLinecap='round' strokeWidth='3.8' x1='78' x2='78' y1='52' y2='82'></line>
              <line stroke='#d5dbd7' strokeLinecap='round' strokeWidth='3.5' x1='88' x2='86' y1='52' y2='82'></line>
              <ellipse cx='62' cy='50' fill='#f8faf9' rx='28' ry='16'></ellipse>
              <path d='M48 37 C 50 48, 48 57, 46 64' fill='none' stroke='#161b18' strokeLinecap='round' strokeWidth='2.8'></path>
              <path d='M56 34 C 57 48, 55 58, 53 66' fill='none' stroke='#161b18' strokeLinecap='round' strokeWidth='3'></path>
              <path d='M64 34 C 65 48, 63 58, 62 66' fill='none' stroke='#161b18' strokeLinecap='round' strokeWidth='3'></path>
              <path d='M72 36 C 74 46, 73 57, 72 65' fill='none' stroke='#161b18' strokeLinecap='round' strokeWidth='2.8'></path>
              <path d='M80 39 C 83 48, 84 57, 85 63' fill='none' stroke='#161b18' strokeLinecap='round' strokeWidth='2.8'></path>
              <path d='M38 48 C 32 38, 24 30, 16 26' stroke='#f8faf9' strokeLinecap='round' strokeWidth='9'></path>
              <path d='M32 40 L 26 34 M28 46 L 22 40' stroke='#161b18' strokeLinecap='round' strokeWidth='2.8'></path>
              <polygon fill='#f8faf9' points='18,25 7,29 13,36'></polygon>
              <circle className='anim-blink' cx='14' cy='28' fill='#1b120c' r='1.3'></circle>
              <ellipse cx='8' cy='30' fill='#1b120c' rx='2.5' ry='2'></ellipse>
            </svg>
          </div>
        </div>
        <div className='w-full relative h-9 sm:h-14 bg-gradient-to-t from-[#0c1a14] via-[#0d2218] to-[#123122]/60 border-t border-[#235839]/25'>
          <svg className='anim-sway-l absolute -top-8 sm:-top-14 left-0 w-24 sm:w-44 h-18 sm:h-32 text-[#133522] pointer-events-none' fill='currentColor' viewBox='0 0 160 120'>
            <path d='M0 120 C 20 80, 50 40, 110 30 C 90 45, 100 65, 80 75 C 95 85, 75 95, 0 120 Z' opacity='0.95'></path>
            <path d='M10 120 C 35 70, 80 45, 130 50 C 115 65, 125 80, 95 85 C 105 100, 70 105, 10 120 Z' fill='#1a462c' opacity='0.8'></path>
          </svg>
          <svg className='anim-sway-r absolute -top-8 sm:-top-14 right-0 w-24 sm:w-44 h-18 sm:h-32 text-[#133522] pointer-events-none' fill='currentColor' viewBox='0 0 160 120'>
            <path d='M160 120 C 140 80, 110 40, 50 30 C 70 45, 60 65, 80 75 C 65 85, 85 95, 160 120 Z' opacity='0.95'></path>
            <path d='M150 120 C 125 70, 80 45, 30 50 C 45 65, 35 80, 65 85 C 55 100, 90 105, 150 120 Z' fill='#1a462c' opacity='0.8'></path>
          </svg>
          <div className='firefly-1 absolute bottom-2 left-[14%] w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]'></div>
          <div className='firefly-2 absolute bottom-4 left-[42%] w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_#ffdf98]'></div>
          <div className='firefly-3 absolute bottom-3 right-[34%] w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]'></div>
          <div className='firefly-1 absolute bottom-4 right-[16%] w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#a5d0b6]' style={{ animationDelay: '1.5s' }}></div>
        </div>
      </div>
    </div>
  );
}
