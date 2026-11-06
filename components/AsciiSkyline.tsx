import type { ComponentProps } from "react";
import AsciiArt from "./AsciiArt";

const SKYLINE: string[] = [
  "                                       \\\\/                 \\\\/                                                                                                                                                                                  ",
  "                                       =+*                .&X-                                                                                                                                                                                  ",
  "                                      |Z%~.               |Z%+/                                                                                                   \\\\\\                                                                           ",
  "                                       &XO|               |&XO                                       \\/                                             |/         \\\\O%HZ%\\\\               /                                                        ",
  "                                       %B#|               |M@#                  \\/                  \\8W                                             H8/    |@8HZ%~=+*:-8=#&#         \\\\*/                              \\                        ",
  "            \\            /            .&XO:               :&X-.      \\     \\    X/          \\        \\:                 \\         \\                 \\*    \\|%B/&/\\\\\\\\\\\\S\\&8O\\     \\\\/O8&Z|//                           ||                       ",
  "           #&/          &%/           .8W%/               |#&#      HM%    ||\\=Z*:S~\\\\|    #&*      .#S.               \\W/       \\B/                -Z^   &XO8HZ%#S*&XO8HZ%#S^    |Z|#|8|XO|/                        \\&8W8/                     ",
  "           O8|\\\\\\\\\\\\\\\\\\\\Z%|            B#&\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\@8|      \\\\/    \\\\*|&||8H://    \\\\/       O8                .::       |+/                +*   \\M@8W%B#&M@8W%B#&M@8W/   \\&\\O8B\\%#S/   |H/                \\8W%B#&M&\\                \\*/",
  "           #B|&M@8W%B#&*&8|            Z@8W%B#&M@8W%B#&M@8W%B/     \\HZ%|   %B8&M@8W%&#&    +S*       #S                |@#   \\   |W|                -~  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/  \\H%B#&M@8W%/   \\*/               |%B#&M@8W%B|               8H|",
  " \\\\\\\\\\\\\\\\\\/OMH8|      |H%B/\\\\\\\\\\\\\\\\\\/ ~&XO8HM@8W%B#&M@8W%S*&XO8    \\*&8|\\\\\\%#S*&XO8HZ%#\\./ O8@      |O8.               |%| \\Z@#\\/|#|               .*&: |BZ%M@*&%*::~=#W:B#O8@8  |*&:O8HZ%#S*   8B|    \\X/      \\/.O8HZ%#S*&X.\\/      \\O/    S8|",
  "\\M@8W%B#&M/#W%B#&M@8W%B*&MO8W%B#&M@8W.H#&M@8^%^8&+@:W%=X^M@8W%B    .H%B#S*&8O8HZ%#S*&XO8HZ%8W%      |#S          \\/    .&M@8W%B#&M@|    \\/          :|| |*&XO8H:.      ~\\M%#S~B  ||| + *||\\ *   SM|    |&|    /8&M%#W%B#&M@8/%B#//    |#|    8B|",
  "|W%B\\\\\\\\\\|XB#&Z@8S*&XO8@8W#B/\\\\\\\\\\%B# *&XO%H~=+S*-~=8H:-~S*&XO8    S*&XO8HZ%#S*&XO8HZ%#S*&XO8HZ.    |O8|       \\\\HZ%\\  .8W%B#&M@8W%|  \\\\#S*\\        :|| |HZ%#-*&       S:&XO8*Z  |/|\\O\\\\\\/|\\|   8WZ    &8| | \\#\\\\//B#&M@8W%B#||\\/|/|| |@|    &M&",
  "|#S*&XO8HZ%#S*W%B#HZ%8W%&XO8HZ%#S*&XO+*Z%#&*&|W%BZ%M@8WXO8&Z%#*    +@Z^^S^\\:-8=Z*:S^=8W%B#&M@8^     \\#S/      |:S||MO: .B#&*-^=+H#&| ||X||HZ:      \\\\\\/ S*&MO8H%       8\\Z%#S*W \\\\H\\\\/\\\\&X\\\\H\\/ B#&    ZB| |=XO8-Z%MS \\X\\\\ M@#=+B\\O8| |%|    8WZ",
  "|@8WZB#&M&XO8|#%+^  ^O#&|||S%BX&M=8W# |&XO8-~|#S*@8O8H#%~\\8*XO     |%BXOM\\~=+*:^~|8\\/B#=*&:W%B      |O8H\\\\\\\\\\\\\\O8HZ%#/\\\\M@/     \\@8O\\\\Z%#S*&/\\\\\\\\\\\\S+&| |H^^^-*&       S:&^^^*# |=+*:-~=+%:-~& \\M@Z    &M| | |#|\\ 8W8H#%#@*W%O\\/Z%||| |&8   \\B#&",
  "|%B#|~  ^Z%#S|@X     |S*||||H  .S\\B#O |Z%\\B+*|/8W%B#&M&X*:B|%#      HM%8W :^^:^.:|B~=M@8HZ%#&*    \\ |~|*W%B#&M@8W*B#OM@8W#  \\\\/  |B#&M@8W%B#&M@8W%B#\\Z| |*   |H8       8=Z   |@ |\\\\\\\\\\\\\\\\%\\\\\\Z |W%B    8W| |\\XO8HZB#SM@XO%H#&MS*WXO8| |8S    M@Z",
  "|&M@|W%B#&XO8|%/      \\B||||8W%B#|M@# |&X\\M\\Z||B#&M@8WZ%#=M|XO\\B/  S*&%B#HZ%. \\&XOM@8W%=+*:@8HZ  |M||*|B~=#S:-X=+&:-#=+B#O \\8W%/ |M@:-Z=+S:-X=+*Z-~@\\&| |H   |*B       S:&   |% |S.^8W~ Z&# \\W |#&M    B#| | |#|\\.M@8W%*#&*@8O /Z%||| XB8   |W%B",
  "|8W%|#&M@Z%#S*&|      |M&XO8B#&M@|W%O |Z%#W\\\\||M@8W%B#&X\\:W|%\\\\*   \\\\Z&M@8W%/ |M@8W%B#O    #S*/  \\H/|#SM/ O8 Z&.\\8 ^B^|M@# |B#&8 |W%^.&/ 8/ %# \\& \\%\\Z| |*\\\\\\\\HM       8=Z\\\\\\\\& ||  %#  \\8   Z \\@8W\\\\\\\\M@#\\*\\X&8HZW%S#&XO8W%B#S*@8O8H\\&M@\\\\\\O#&M",
  "|B#H|@8W%&X&M@8|      |W%B#SM@8W%|#&# |&X*#HM%|W%B#&M@|%%S#|X-|WZ%#&M&XO8HZ%MS8&XO8HZ%#S*BXO8@8%#S#|X@8WZ%#S*&8O8BZ%MS*W%| |M@8S |#&8H8%#S*&XO8HZ%#&M@X |H   |*&       S:&   |Z |S\\\\XO\\\\\\B\\\\\\& O%B#&M@8W%B#&M@8W%B#&M@8W%B#&M@8W%B#&M@8W%B#&M@8W"
];

export default function AsciiSkyline(props: ComponentProps<"div">) {
  return (
    <AsciiArt
      lines={SKYLINE}
      role="img"
      aria-label="Indian monuments skyline ascii art: Gateway of India, Charminar, Golden Temple, Jama Masjid, India Gate, Lotus Temple, Taj Mahal"
      {...props}
    />
  );
}
