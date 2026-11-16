
type IllustrationProps = { className?: string };

export function Sprig({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 220" className={className} fill="none" aria-hidden="true">
      <path d="M69 218C73 156 63 83 75 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {[30, 65, 100, 135, 170].map((y, i) => (
        <g key={y}>
          <path d={`M70 ${y + 20}C${25-i*2} ${y+7} ${18-i*2} ${y-30} 39 ${y-36}C61 ${y-26} 68 ${y-4} 70 ${y+20}Z`} fill="currentColor" opacity=".8"/>
          <path d={`M70 ${y+12}C${105+i*2} ${y+4} ${124+i*2} ${y-29} 102 ${y-38}C80 ${y-26} 72 ${y-4} 70 ${y+12}Z`} fill="currentColor" opacity=".65"/>
        </g>
      ))}
    </svg>
  );
}

export function Elephant({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 260 220" className={className} fill="none" aria-hidden="true">
      <path d="M47 83C39 44 72 25 105 37C133 20 179 39 193 76C211 84 218 113 207 139L199 187H177L169 142H104L96 188H72L68 139C47 128 38 105 47 83Z" fill="#A7A99A"/>
      <path d="M63 66C30 34 8 77 31 120C43 143 69 139 83 112C96 85 86 63 63 66Z" fill="#858E82"/>
      <path d="M62 78C43 62 31 87 43 109C51 123 67 116 73 99" fill="#C1B9A3"/>
      <path d="M190 92C220 97 225 124 212 145C204 158 214 180 200 193C187 204 174 190 183 174L183 132" fill="#929B8D"/>
      <path d="M189 154C185 171 179 181 182 191" stroke="#747F73" strokeWidth="3" strokeLinecap="round"/>
      <path d="M80 181L78 207M106 177L107 207M166 178L168 207M190 177L191 207" stroke="#858E82" strokeWidth="17" strokeLinecap="round"/>
      <path d="M31 91C22 82 17 73 18 62" stroke="#858E82" strokeWidth="5" strokeLinecap="round"/>
      <path d="M203 115C217 110 222 118 215 129" stroke="#F0E5CE" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="62" cy="83" r="4" fill="#292F28"/>
      <path d="M51 76L60 73" stroke="#59665B" strokeWidth="2" strokeLinecap="round"/>
      <path d="M115 48C137 36 169 43 181 68" stroke="#C9C5B3" strokeWidth="3" opacity=".7"/>
      <path d="M83 125C111 137 156 137 185 123" stroke="#747F73" strokeWidth="2" opacity=".4"/>
      <path d="M77 208H94M157 208H176" stroke="#D4C5A8" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

export function Giraffe({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 180 300" className={className} fill="none" aria-hidden="true">
      <path d="M65 130C49 105 48 76 59 47C65 30 79 23 94 31C109 39 109 59 100 78L105 146" fill="#D4A35D"/>
      <path d="M62 131C40 135 25 151 29 176L37 255H52L61 190L82 190L88 255H103L109 171C114 151 102 136 87 130Z" fill="#D4A35D"/>
      <path d="M58 46C42 29 48 12 67 13C80 14 83 28 78 38C92 21 112 23 117 39C120 53 108 66 94 66L76 58Z" fill="#D4A35D"/>
      <path d="M58 17L54 3M99 25L104 8" stroke="#B88448" strokeWidth="5" strokeLinecap="round"/>
      <path d="M51 4L58 4M102 8L109 8" stroke="#493D2B" strokeWidth="5" strokeLinecap="round"/>
      <path d="M45 147L55 138L65 148L56 159ZM78 145L91 139L99 152L87 162ZM39 185L52 178L60 192L45 202ZM83 183L98 177L105 190L91 201ZM47 226L59 219L65 232L51 240" fill="#875B39" opacity=".85"/>
      <path d="M57 79L70 73L78 88L64 96ZM88 95L101 89L105 104L93 111Z" fill="#875B39"/>
      <path d="M72 67C77 73 87 76 95 69" stroke="#F1D3A0" strokeWidth="3" opacity=".7"/>
      <circle cx="102" cy="42" r="3.5" fill="#302D25"/>
      <path d="M102 53Q94 59 86 55" stroke="#805536" strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 170L25 177M105 169L116 177" stroke="#B88448" strokeWidth="3" strokeLinecap="round"/>
      <path d="M34 255H54M87 255H107" stroke="#514331" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

export function Zebra({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 170" className={className} fill="none" aria-hidden="true">
      <path d="M38 70C52 39 105 31 157 49C181 58 189 83 177 111L165 134H54C34 119 25 95 38 70Z" fill="#F0E9D8"/>
      <path d="M43 65L66 52L86 130H68ZM84 44L106 44L124 133H105ZM132 48L153 57L166 127H148Z" fill="#303C34"/>
      <path d="M53 125L48 163M92 127L90 163M145 126L150 163M169 120L181 161" stroke="#EDE7D9" strokeWidth="12" strokeLinecap="round"/>
      <path d="M155 69C175 45 192 39 202 56L205 87C194 105 174 108 162 94Z" fill="#F0E9D8"/>
      <path d="M178 53L194 85M190 52L201 73" stroke="#303C34" strokeWidth="9"/>
      <path d="M174 48L169 27M194 50L201 30" stroke="#F0E9D8" strokeWidth="8" strokeLinecap="round"/>
      <path d="M35 68C17 52 13 38 19 26C33 38 44 44 51 53" stroke="#303C34" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="195" cy="67" r="3" fill="#303C34"/>
      <path d="M181 92Q190 97 198 89" stroke="#A99F8C" strokeWidth="2"/>
      <path d="M42 79C55 91 60 108 58 126M75 49C90 70 94 98 98 127" stroke="#FFFFFF" strokeWidth="2" opacity=".5"/>
    </svg>
  );
}

export function Monkey({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 180 190" className={className} fill="none" aria-hidden="true">
      <path d="M112 130C157 140 159 175 130 174C111 173 120 152 137 157" stroke="#80583A" strokeWidth="9" strokeLinecap="round"/>
      <path d="M57 101C35 107 32 145 49 163L112 163C132 145 127 111 105 101Z" fill="#80583A"/>
      <path d="M48 64C47 37 68 20 91 24C117 28 130 49 119 77C112 101 92 110 67 95Z" fill="#80583A"/>
      <circle cx="52" cy="64" r="17" fill="#A87852"/>
      <circle cx="116" cy="64" r="17" fill="#A87852"/>
      <path d="M57 59C61 43 77 39 90 43C108 45 117 60 110 77C105 92 91 98 74 91C59 85 52 73 57 59Z" fill="#E8CBA3"/>
      <ellipse cx="73" cy="61" rx="4" ry="5" fill="#302A25"/>
      <ellipse cx="98" cy="61" rx="4" ry="5" fill="#302A25"/>
      <path d="M80 74Q87 80 94 73" stroke="#80583A" strokeWidth="3" strokeLinecap="round"/>
      <path d="M51 113L28 147M111 113L134 143" stroke="#80583A" strokeWidth="12" strokeLinecap="round"/>
      <path d="M61 159L55 181M104 159L112 181" stroke="#80583A" strokeWidth="13" strokeLinecap="round"/>
      <path d="M70 32Q86 17 105 35" stroke="#A87852" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}

export function Deer({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 210" className={className} fill="none" aria-hidden="true">
      <path d="M70 106C50 82 51 61 39 37M39 37L19 22M39 37L43 9M130 104C146 77 151 51 164 32M164 32L185 15M164 32L160 6" stroke="#956D46" strokeWidth="6" strokeLinecap="round"/>
      <path d="M43 103C48 82 75 73 108 82C133 89 145 111 132 139L120 166H61L45 140Z" fill="#B88C5D"/>
      <path d="M120 97C124 68 144 53 164 62C178 71 171 94 151 105L131 119Z" fill="#B88C5D"/>
      <path d="M151 97C165 89 182 94 180 105C173 116 157 113 144 109Z" fill="#E9D8B8"/>
      <path d="M56 146L49 197M80 148L78 197M117 145L125 197M136 136L148 192" stroke="#A77A4F" strokeWidth="9" strokeLinecap="round"/>
      <path d="M55 197H70M112 197H130" stroke="#594832" strokeWidth="4" strokeLinecap="round"/>
      <path d="M48 91L56 74M62 85L69 69M90 87L97 72M111 94L117 81" stroke="#E8D2A9" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="160" cy="79" r="3.5" fill="#302A25"/>
      <path d="M172 104L180 106" stroke="#694B34" strokeWidth="2"/>
      <path d="M58 122Q92 143 126 125" stroke="#D5B38A" strokeWidth="2" opacity=".6"/>
    </svg>
  );
}

export function Bird({ className = "" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 65" className={className} fill="none" aria-hidden="true">
      <path d="M8 36C23 15 34 17 50 36C65 17 78 15 92 36C73 28 64 43 50 52C36 43 25 28 8 36Z" fill="currentColor"/>
      <path d="M50 36Q48 23 40 17M50 36Q56 23 64 17" stroke="currentColor" strokeWidth="2" opacity=".45"/>
    </svg>
  );
}

export function WildlifeScene({ className = "" }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1100 490"
      className={className}
      fill="none"
      role="img"
      aria-label="Illustrated jungle adventure with wildlife and a group of young friends standing together"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="jungleSky" x1="550" y1="0" x2="550" y2="490" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9FAE83" stopOpacity=".12"/>
          <stop offset="1" stopColor="#D5B77D" stopOpacity=".2"/>
        </linearGradient>
        <linearGradient id="elephantSkin" x1="410" y1="160" x2="570" y2="370" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B7B7A5"/>
          <stop offset="1" stopColor="#777F72"/>
        </linearGradient>
        <linearGradient id="jungleGround" x1="550" y1="340" x2="550" y2="490" gradientUnits="userSpaceOnUse">
          <stop stopColor="#647B4C"/>
          <stop offset="1" stopColor="#263F30"/>
        </linearGradient>
      </defs>

      {/* Atmospheric background */}
      <path d="M0 0H1100V490H0Z" fill="url(#jungleSky)"/>
      <circle cx="545" cy="170" r="135" fill="#E8D3A1" opacity=".1"/>
      <path d="M0 270C140 203 222 237 342 270C460 303 580 226 700 254C839 286 974 214 1100 252V490H0Z" fill="#536C49" opacity=".25"/>
      <path d="M0 325C157 271 272 304 405 326C560 353 734 278 861 311C967 337 1047 300 1100 318V490H0Z" fill="#425C40" opacity=".42"/>

      {/* Distant trees */}
      <g fill="#344F39" opacity=".65">
        <path d="M0 300V85C43 62 75 84 82 130C111 71 163 82 177 137C215 75 257 108 253 168C288 128 333 145 345 204V325Z"/>
        <path d="M756 310V157C785 110 833 117 853 166C879 98 934 105 948 161C982 109 1030 133 1034 191C1060 164 1088 182 1100 214V340Z"/>
      </g>

      {/* Large canopy branches */}
      <g stroke="#344B35" strokeLinecap="round" fill="none">
        <path d="M-25 69C125 17 205 50 309 105C355 130 393 122 422 96" strokeWidth="15"/>
        <path d="M1125 63C1008 10 924 43 851 95C813 120 785 115 756 95" strokeWidth="15"/>
        <path d="M95 35C120 75 131 109 119 147M986 29C962 73 954 106 969 142" strokeWidth="7"/>
      </g>

      {/* Canopy leaves */}
      <g fill="#526E48">
        <path d="M-20 91C12 19 72 17 103 62C55 58 22 79-20 91Z"/>
        <path d="M40 65C53 4 117-8 149 33C102 30 76 48 40 65Z"/>
        <path d="M145 73C150 17 213 3 244 41C207 36 180 56 145 73Z"/>
        <path d="M225 94C248 33 308 37 330 78C291 65 261 81 225 94Z"/>
        <path d="M1120 83C1089 11 1029 15 997 57C1044 52 1080 73 1120 83Z"/>
        <path d="M1050 56C1036-5 974-16 941 24C984 21 1016 41 1050 56Z"/>
        <path d="M950 88C924 28 866 35 844 76C882 62 914 77 950 88Z"/>
        <path d="M865 104C842 47 789 54 765 91C802 80 831 94 865 104Z"/>
      </g>
      <g fill="#78905C" opacity=".8">
        <path d="M7 143C-4 87 38 62 77 85C44 98 30 122 7 143Z"/>
        <path d="M1080 145C1095 90 1052 66 1014 89C1048 100 1060 124 1080 145Z"/>
        <path d="M291 139C295 90 340 75 370 108C338 107 318 124 291 139Z"/>
        <path d="M807 142C803 92 759 80 729 112C760 109 780 127 807 142Z"/>
      </g>

      {/* Hanging vines */}
      <g stroke="#778A56" strokeWidth="4" strokeLinecap="round">
        <path d="M170 0C160 69 196 85 174 144C164 171 180 190 191 201"/>
        <path d="M930 0C945 70 912 99 933 150C947 184 930 196 922 212"/>
        <path d="M275 0C266 41 282 70 271 102"/>
        <path d="M820 0C832 48 812 72 823 112"/>
      </g>

      {/* Monkey sitting in the left canopy */}
      <g transform="translate(108 119)">
        <path d="M57 104C93 112 101 139 77 145C60 148 62 132 77 130" stroke="#704D37" strokeWidth="9" strokeLinecap="round"/>
        <path d="M27 74C10 84 12 114 31 125L79 124C95 105 83 78 62 73Z" fill="#80583B"/>
        <path d="M26 38C28 9 64 4 80 26C96 49 80 77 55 77C34 75 21 58 26 38Z" fill="#80583B"/>
        <circle cx="29" cy="42" r="12" fill="#A87852"/>
        <circle cx="78" cy="42" r="12" fill="#A87852"/>
        <path d="M35 36C42 22 66 24 73 40C82 59 67 69 52 67C36 66 28 50 35 36Z" fill="#E4C39A"/>
        <circle cx="46" cy="43" r="3" fill="#302A25"/>
        <circle cx="65" cy="43" r="3" fill="#302A25"/>
        <path d="M49 54Q56 60 63 54" stroke="#79543C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M31 92L14 119M76 94L91 115" stroke="#80583B" strokeWidth="9" strokeLinecap="round"/>
      </g>

      {/* Birds */}
      <g className="wildlife-bird wildlife-bird-one" fill="#D9C69A">
        <path d="M0 20Q21-2 42 20Q62-2 83 20Q62 11 42 34Q21 11 0 20Z"/>
      </g>
      <g className="wildlife-bird wildlife-bird-two" fill="#E7D8B8">
        <path d="M0 20Q18 1 36 20Q54 1 72 20Q54 12 36 32Q18 12 0 20Z"/>
      </g>
      <g fill="#D6BD88">
        <path d="M755 106Q771 88 787 106Q803 88 819 106Q803 99 787 116Q771 99 755 106Z"/>
        <path d="M847 75Q859 62 871 75Q883 62 895 75Q883 69 871 83Q859 69 847 75Z"/>
      </g>

      {/* Giraffe in the right background */}
      <g transform="translate(824 68)">
        <path d="M43 193C30 160 34 122 39 91L31 38C27 20 43 9 59 16C77 23 76 43 66 58L72 128C96 128 119 143 120 167L115 218H99L95 183L65 185L62 218H47Z" fill="#D4A15D"/>
        <path d="M31 38C11 17 22 1 39 7C48 10 50 21 45 30C57 13 76 18 79 31C81 43 67 54 54 53Z" fill="#D4A15D"/>
        <path d="M29 8L25-3M62 14L67 2" stroke="#A97843" strokeWidth="4" strokeLinecap="round"/>
        <path d="M23-3L28-4M64 2L70 1" stroke="#44382A" strokeWidth="4" strokeLinecap="round"/>
        <path d="M37 79L51 72L60 85L45 94ZM46 118L63 112L68 129L49 137ZM78 143L96 138L102 155L83 162ZM106 160L119 155L125 171L109 178Z" fill="#895B38"/>
        <path d="M44 31Q53 37 62 29" stroke="#895B38" strokeWidth="2"/>
        <circle cx="65" cy="32" r="3" fill="#302A25"/>
      </g>

      {/* Deer at right */}
      <g transform="translate(905 248)">
        <path d="M30 42L19 5L5-7M19 5L26-12M74 43L91 8L105-3M91 8L89-11" stroke="#A27B50" strokeWidth="4" strokeLinecap="round"/>
        <path d="M21 56C27 34 59 28 81 43C100 56 95 83 82 100H38C21 91 14 74 21 56Z" fill="#B88E60"/>
        <path d="M71 52C76 32 93 27 107 39C115 51 101 66 86 69Z" fill="#B88E60"/>
        <path d="M99 58Q118 49 121 63Q114 74 99 69Z" fill="#E9D6B3"/>
        <path d="M30 91L27 131M48 94L48 132M78 91L83 129M91 82L99 124" stroke="#A47A50" strokeWidth="7" strokeLinecap="round"/>
        <circle cx="103" cy="46" r="2.5" fill="#302A25"/>
        <path d="M34 47L40 41M49 40L55 34M66 46L72 40" stroke="#EBD4AD" strokeWidth="4" strokeLinecap="round"/>
      </g>

      {/* Elephant - central hero animal */}
      <g transform="translate(360 143)">
        <path d="M54 89C54 43 93 17 149 27C193 35 224 67 218 112L205 177H180L173 135H106L96 180H69L67 132C52 121 47 105 54 89Z" fill="url(#elephantSkin)"/>
        <path d="M69 79C28 35 3 69 17 116C29 153 70 153 91 120C102 100 92 80 69 79Z" fill="#929B8C"/>
        <path d="M69 88C40 64 29 88 43 115C52 131 71 123 79 107" fill="#C2BDA9" opacity=".85"/>
        <path d="M197 91C227 91 240 119 222 143C210 161 220 178 205 196C189 207 177 190 188 174L188 128" fill="#858F81"/>
        <path d="M204 153C196 170 193 181 190 194" stroke="#707A6D" strokeWidth="3" strokeLinecap="round"/>
        <path d="M79 163L76 198M111 163L111 199M173 159L174 198M198 157L201 198" stroke="#858F81" strokeWidth="18" strokeLinecap="round"/>
        <path d="M24 104C15 96 13 83 19 71" stroke="#7E887A" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="61" cy="88" r="4" fill="#30372E"/>
        <path d="M52 81L62 77" stroke="#657265" strokeWidth="2" strokeLinecap="round"/>
        <path d="M57 123C94 143 157 144 192 121" stroke="#D4D1C0" strokeWidth="2" opacity=".4"/>
        <path d="M91 47C126 32 165 47 181 71" stroke="#D4D1C0" strokeWidth="3" opacity=".4"/>
        <path d="M190 113Q201 108 207 120" stroke="#D7C8A6" strokeWidth="4" strokeLinecap="round"/>
        <path d="M77 199H96M163 199H183" stroke="#D6C6A7" strokeWidth="4" strokeLinecap="round"/>
      </g>

      {/* Zebra in the right middle ground */}
      <g transform="translate(680 266)">
        <path d="M12 53C29 22 79 16 116 34C142 47 147 74 129 98L119 116H28C8 100 3 74 12 53Z" fill="#EEE8D9"/>
        <path d="M19 47L39 31L56 112H38ZM59 30L80 30L94 115H75ZM101 37L121 51L127 108H110Z" fill="#354238"/>
        <path d="M30 106L27 151M66 108L65 151M109 108L113 151M127 103L139 147" stroke="#EEE8D9" strokeWidth="10" strokeLinecap="round"/>
        <path d="M117 52C140 29 157 28 165 46L163 75C148 91 131 90 119 76Z" fill="#EEE8D9"/>
        <path d="M142 44L155 70M154 41L166 57" stroke="#354238" strokeWidth="7"/>
        <path d="M131 40L126 24M155 39L164 22" stroke="#EEE8D9" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="157" cy="53" r="2.5" fill="#30372E"/>
        <path d="M13 57Q-2 37 7 22" stroke="#354238" strokeWidth="5" strokeLinecap="round"/>
      </g>

      {/* Ground */}
      <path d="M0 374C139 333 261 368 376 380C523 397 646 354 766 369C889 384 1003 345 1100 365V490H0Z" fill="url(#jungleGround)"/>
      <path d="M0 413C152 380 250 405 365 416C522 431 642 399 787 411C902 420 1010 394 1100 403" stroke="#8A9A62" strokeWidth="3" opacity=".45"/>

      {/* Foreground leaves */}
      <g fill="#738957">
        <path d="M0 405C34 334 87 343 102 392C62 383 35 397 0 405Z"/>
        <path d="M0 452C32 383 91 395 99 439C60 426 33 442 0 452Z"/>
        <path d="M1100 407C1068 336 1013 346 997 395C1036 385 1064 400 1100 407Z"/>
        <path d="M1100 454C1066 386 1010 397 1000 442C1040 429 1067 445 1100 454Z"/>
      </g>
      <g fill="#9BA66C">
        <path d="M15 474C34 422 65 417 83 451C53 451 38 464 15 474Z"/>
        <path d="M1083 477C1062 424 1032 420 1014 453C1043 452 1060 465 1083 477Z"/>
      </g>

      {/* Young people standing together - viewed from behind */}
      <g transform="translate(365 320)">
        {/* Ground shadows */}
        <ellipse cx="183" cy="151" rx="180" ry="17" fill="#1C3327" opacity=".45"/>

        {/* Left person */}
        <path d="M33 59C27 40 34 24 50 20C66 16 82 27 83 46L79 69L34 69Z" fill="#B17D54"/>
        <path d="M31 70C12 76 6 106 12 148H102C106 112 95 78 76 70Z" fill="#D0B18A"/>
        <path d="M33 77L7 115L0 142L13 149L37 113M77 78L101 109L108 137L94 144L70 111" fill="#B17D54"/>
        <path d="M32 145L31 169M77 145L78 169" stroke="#B17D54" strokeWidth="17" strokeLinecap="round"/>
        <path d="M20 170H45M68 170H90" stroke="#D8C5A6" strokeWidth="6" strokeLinecap="round"/>

        {/* Second person */}
        <path d="M103 53C102 31 116 18 136 19C156 20 167 37 160 59L151 74H111Z" fill="#302B26"/>
        <path d="M106 69C84 75 80 100 84 148H174C178 108 167 77 148 69Z" fill="#A9B3A0"/>
        <path d="M105 80L80 117L91 143L105 135L125 108M149 78L171 112L184 136L170 145L146 109" fill="#A9B3A0"/>
        <path d="M105 147L105 171M151 147L151 171" stroke="#30302C" strokeWidth="17" strokeLinecap="round"/>
        <path d="M94 173H119M139 173H165" stroke="#D7C7A9" strokeWidth="6" strokeLinecap="round"/>

        {/* Centre person */}
        <path d="M171 48C165 22 182 4 204 6C227 8 238 30 228 54L216 69H183Z" fill="#44352B"/>
        <path d="M177 67C157 72 151 105 155 149H251C255 105 244 75 224 67Z" fill="#C49B5C"/>
        <path d="M178 79L152 112L147 140L161 145L187 109M222 78L246 108L260 139L245 145L220 110" fill="#C49B5C"/>
        <path d="M177 147L177 174M226 147L228 174" stroke="#44352B" strokeWidth="18" strokeLinecap="round"/>
        <path d="M165 176H191M215 176H240" stroke="#D8C5A6" strokeWidth="6" strokeLinecap="round"/>

        {/* Fourth person */}
        <path d="M250 58C245 33 259 17 279 18C300 19 311 39 302 62L291 76H260Z" fill="#282D29"/>
        <path d="M257 73C236 80 230 107 235 150H325C328 108 315 80 298 73Z" fill="#7E9275"/>
        <path d="M258 82L232 113L220 139L235 147L265 109M296 81L322 112L332 140L318 147L289 109" fill="#7E9275"/>
        <path d="M257 149L256 174M300 149L301 174" stroke="#282D29" strokeWidth="18" strokeLinecap="round"/>
        <path d="M244 176H269M288 176H313" stroke="#D8C5A6" strokeWidth="6" strokeLinecap="round"/>

        {/* Fifth person */}
        <path d="M326 61C320 39 332 21 351 21C370 21 382 38 376 61L367 75H338Z" fill="#694833"/>
        <path d="M333 73C315 80 309 108 313 150H401C403 111 392 81 375 73Z" fill="#C4B4A0"/>
        <path d="M335 83L310 115L302 141L316 148L341 112M374 82L400 114L409 140L395 148L369 112" fill="#C4B4A0"/>
        <path d="M334 150L333 174M378 150L380 174" stroke="#694833" strokeWidth="17" strokeLinecap="round"/>
        <path d="M322 176H346M368 176H391" stroke="#D8C5A6" strokeWidth="6" strokeLinecap="round"/>
      </g>

      {/* Small foreground plants */}
      <g stroke="#A7A96D" strokeWidth="3" strokeLinecap="round">
        <path d="M292 465Q282 434 267 422M292 465Q294 430 312 411M292 465Q270 450 251 452"/>
        <path d="M820 465Q832 433 848 422M820 465Q818 431 801 411M820 465Q844 450 862 452"/>
      </g>
      <g fill="#A7A96D">
        <ellipse cx="265" cy="420" rx="8" ry="15" transform="rotate(-42 265 420)"/>
        <ellipse cx="314" cy="409" rx="8" ry="15" transform="rotate(36 314 409)"/>
        <ellipse cx="250" cy="451" rx="8" ry="15" transform="rotate(-75 250 451)"/>
        <ellipse cx="850" cy="420" rx="8" ry="15" transform="rotate(42 850 420)"/>
        <ellipse cx="800" cy="409" rx="8" ry="15" transform="rotate(-36 800 409)"/>
        <ellipse cx="864" cy="451" rx="8" ry="15" transform="rotate(75 864 451)"/>
      </g>
    </svg>
  );
}
