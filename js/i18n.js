// Bản dịch tiếng Việt (ngắn gọn) cho toàn bộ chữ hiển thị trong game.
// Được gọi từ font.js nên mọi nơi dùng drawText / drawTiny đều tự động dịch.

const WORDS = new Map([
  // --- tiêu đề / nút ---
  ['THE LITTLE', 'CHÚ NHỎ'],
  ['RACCOON', 'GẤU MÈO'],
  ['BEGIN ADVENTURE', 'BẮT ĐẦU'],
  ['PAUSED', 'TẠM DỪNG'],
  ['RESUME', 'TIẾP TỤC'],
  ['RESTART', 'CHƠI LẠI'],
  ['MUTE', 'TẮT TIẾNG'],
  ['UNMUTE', 'BẬT TIẾNG'],
  ['PLAY AGAIN', 'CHƠI LẠI'],
  ['READ THE LETTER', 'ĐỌC THƯ'],

  // --- HUD ---
  ['BIRTHDAY QUEST', 'NHIỆM VỤ SINH NHẬT'],
  ['NEXT', 'TIẾP'],
  ['ALL FOUND! GO INSIDE', 'ĐỦ RỒI! VÀO NHÀ'],
  ['EXPLORE THE FOREST', 'KHÁM PHÁ RỪNG'],
  ['MOVE WASD/ARROWS  ACT E/SPACE', 'WASD DI CHUYỂN  E TƯƠNG TÁC'],
  ['MOVE: ARROWS/WASD   ACT: E/SPACE   MAP: TAB', 'WASD DI CHUYỂN  E TƯƠNG TÁC  TAB BẢN ĐỒ'],
  ['F FULLSCREEN  \u00b7  M MUTE  \u00b7  FOR LAZY', 'F TOÀN MÀN HÌNH \u00b7 M TẮT TIẾNG \u00b7 CHO LAZY'],
  ['MAP', 'BẢN ĐỒ'],
  ['LANTERN ST LIT', 'ĐÈN LỒNG SÁNG'],
  ['Pink Flower', 'Hoa Hồng'],
  ['Purple Flower', 'Hoa Tím'],
  ['Golden Star', 'Sao Vàng'],
  ['Blue Crystal', 'Pha Lê Xanh'],
  ['Special Ribbon', 'Nơ Đặc Biệt'],
  ['pink flower', 'hoa hồng'],
  ['purple flower', 'hoa tím'],
  ['golden star', 'sao vàng'],
  ['blue crystal', 'pha lê xanh'],
  ['special ribbon', 'nơ đặc biệt'],
  ['PINK FLOWER', 'HOA HỒNG'],
  ['PURPLE FLOWER', 'HOA TÍM'],
  ['GOLDEN STAR', 'SAO VÀNG'],
  ['BLUE CRYSTAL', 'PHA LÊ XANH'],
  ['SPECIAL RIBBON', 'NƠ ĐẶC BIỆT'],
  ['A cozy birthday adventure for Lazy  \u00b7  23 November 2010', 'Phiêu lưu sinh nhật cho Lazy \u00b7 23/11/2010'],

  // --- tên khu vực ---
  ['Lantern Street', 'Phố Đèn Lồng'],
  ['LANTERN STREET', 'PHỐ ĐÈN LỒNG'],
  ['Whispering Woods', 'Rừng Thì Thầm'],
  ['Mirror Pond', 'Ao Gương'],
  ['Picnic Clearing', 'Bãi Dã Ngoại'],
  ['Fairy Ring', 'Vòng Nấm Tiên'],
  ['Ancient Stone Circle', 'Vòng Đá Cổ'],
  ['Flower Garden', 'Vườn Hoa'],
  ['Birthday House', 'Nhà Sinh Nhật'],

  // --- lời nhắc tương tác ---
  ['SPACE  ENTER HOUSE', 'SPACE  VÀO NHÀ'],
  ['LOCKED  FIND 5 ITEMS', 'KHÓA  TÌM ĐỦ 5 MÓN'],
  ['SPACE  TALK TO BUNNY', 'SPACE  NÓI VỚI THỎ'],
  ['E / SPACE  TALK', 'E / SPACE  NÓI CHUYỆN'],
  ['E / SPACE  RELIGHT THE STREET', 'E / SPACE  THẮP LẠI PHỐ'],
  ['E / SPACE  PICK UP LANTERN', 'E / SPACE  NHẶT ĐÈN'],
  ['SPACE  READ SIGN', 'SPACE  ĐỌC BIỂN'],
  ['E / SPACE  COLLECT', 'E / SPACE  NHẶT'],
  ['C  CLOSE WARDROBE', 'C  ĐÓNG TỦ ĐỒ'],
  ['E / SPACE  LEAVE HIDDEN ROOM', 'E / SPACE  RA NGOÀI'],
  ['E / SPACE  FISH', 'E / SPACE  CÂU CÁ'],
  ['E / SPACE  WATER FLOWERS', 'E / SPACE  TƯỚI HOA'],
  ['E / SPACE  OPEN TREASURE', 'E / SPACE  MỞ RƯƠNG'],
  ['WAIT FOR A BITE...', 'ĐỢI CÁ CẮN...'],
  ['E / SPACE  REEL IT IN!', 'E / SPACE  KÉO CÁ LÊN!'],
  ['E / SPACE  PEEK BEHIND TREE', 'E / SPACE  NHÌN SAU CÂY'],

  // --- biển bảng ---
  ['Hey there, little raccoon!', 'Này, gấu mèo nhỏ!'],
  ['I heard someone special has a birthday coming up...', 'Nghe nói có ai đó sắp sinh nhật...'],
  ['Can you collect five special items to prepare a surprise?', 'Con tìm giúp 5 món đặc biệt nhé?'],
  ['A Pink Flower, a Purple Flower, a Golden Star,', 'Hoa hồng, hoa tím, sao vàng,'],
  ['a Blue Crystal and a Special Ribbon.', 'pha lê xanh và nơ đặc biệt.'],
  ['Hurry now - Lazy is waiting!', 'Nhanh lên - Lazy đang đợi!'],
  ['The old path leads north into the tall trees.', 'Đường cũ dẫn vào rừng sâu phía bắc.'],
  ['They say a golden star sleeps in a clearing up there.', 'Sao vàng nằm ở trảng cỏ trên đó.'],
  ['Mind your step on the bridge, little friend.', 'Cẩn thận cái cầu nhé, bạn nhỏ!'],
  ['Something blue and shiny glimmers south of the pond.', 'Cái gì xanh lấp lánh ở nam ao kìa.'],
  ['A ring of glowing mushrooms grows to the east.', 'Vòng nấm phát sáng mọc ở phía đông.'],
  ['Make a wish there - it is said to bring good luck.', 'Ở đó ước nguyện - may mắn sẽ đến.'],
  ['The stone circle in the north is very old.', 'Vòng đá phía bắc rất cổ.'],
  ['The crystal at its heart hums when you get close.', 'Pha lê giữa vòng kêu khi lại gần.'],

  // --- NPC ---
  ['Welcome to Lantern Street, little raccoon!', 'Chào mừng đến Phố Đèn Lồng!'],
  ['The night wind carried away three of my red lanterns.', 'Gió đêm thổi bay 3 chiếc đèn đỏ.'],
  ['Bring them back and I will light the whole street for Lazy!', 'Nhặt về ta thắp sáng cả phố cho Lazy!'],
  ['One lantern is still out there, I can feel it.', 'Vẫn còn một chiếc ngoài kia, ta cảm thấy.'],
  ['Check the ends of the lane - they love to hide.', 'Tìm ở hai đầu phố - chúng hay trốn đó.'],
  ['Every lantern is home again!', 'Đèn đã về nhà hết rồi!'],
  ['Look how the whole street glows. Lazy would love this.', 'Phố sáng rực này, Lazy sẽ mê lắm!'],
  ['Hoo hoo! A new friend in the night market.', 'Ú ú! Bạn mới ở chợ đêm.'],
  ['I play a little tune for anyone who says hello.', 'Ta tặng nhạc cho ai chào ta.'],
  ['With the lanterns lit, my music sounds even sweeter.', 'Đèn sáng rồi, nhạc nghe ngọt hơn.'],
  ['Stay a while. The night is warm and full of stars.', 'Ở lại chút đi. Đêm ấm và đầy sao.'],
  ['Cookie, cookie! Fresh from the little oven.', 'Bánh quy nóng đây! Mới ra lò.'],
  ['Here, take two - one for you and one for Lazy.', 'Cầm hai cái - một cho con, một cho Lazy.'],
  ['Saving a cookie for later? Smart little raccoon.', 'Dành bánh ăn sau à? Khôn quá!'],
  ['The fox needs those lanterns more than I need customers.', 'Chú cáo cần đèn hơn ta cần khách.'],
  ['The fox claps with delight!', 'Chú cáo vỗ tay mừng!'],
  ['All three lanterns are home and the street is glowing.', 'Cả 3 đèn đã về, phố sáng rực.'],
  ['A little glowing bow for you - and fireflies will follow you now!', 'Nơ phát sáng tặng bạn - đom đóm đi theo nữa!'],
  ['You found every single one!', 'Con tìm được hết rồi!'],
  ['The birthday house is open now.', 'Nhà sinh nhật đã mở cửa.'],
  ['Lazy is going to love it!', 'Lazy sẽ thích lắm!'],
  ['Oh! A visitor!', 'Ồ! Có khách!'],
  ['I hid a pink flower in the garden, west of here.', 'Ta giấu hoa hồng ở vườn phía tây.'],
  ['It has the loveliest petals!', 'Cánh hoa đẹp lắm!'],
  ['Still searching, little friend?', 'Vẫn đang tìm à, bạn nhỏ?'],
  ['I believe in you!', 'Ta tin ở con!'],
  ['Fox Lantern Maker', 'Cáo Làm Đèn'],
  ['Owl Musician', 'Cú Nhạc Sĩ'],
  ['Cookie Bear', 'Gấu Bán Bánh'],
  ['Lantern Street', 'Phố Đèn Lồng'],
  ['Forest Bunny', 'Thỏ Rừng'],
  ['Wooden Sign', 'Biển Gỗ'],
  ['Birthday House', 'Nhà Sinh Nhật'],
  ['Treasure', 'Kho Báu'],
  ['Garden Helper', 'Người Làm Vườn'],
  ['Flower Garden', 'Vườn Hoa'],
  ['Pond Legend', 'Truyền Thuyết Ao'],
  ['Quest Complete', 'Hoàn Thành'],

  // --- quest / sự kiện ---
  ['The birthday house is locked.', 'Nhà sinh nhật đang khóa.'],
  ['Find all five special items first!', 'Tìm đủ 5 món đặc biệt trước đã!'],
  ['All five treasures found!', 'Đã tìm đủ 5 báu vật!'],
  ['Go inside, little raccoon!', 'Vào đi, gấu mèo nhỏ!'],
  ['The flowers are blooming beautifully!', 'Hoa nở đẹp quá!'],
  ['They made a special flower just for Lazy.', 'Chúng làm riêng một đóa cho Lazy.'],
  ['The little garden is in full bloom!', 'Vườn hoa đã nở rộ!'],
  ['A special flower for Lazy. Wear it proudly!', 'Hoa cho Lazy đó. Đeo lên nhé!'],
  ['A GIANT FISH leaps from the pond!', 'CÁ KHỔNG LỒ nhảy khỏi ao!'],
  ['It is wearing a tiny party hat. The fish knows.', 'Nó đội mũ tiệc nhỏ. Cá biết hết.'],
  ['A secret birthday note: "This little world was made just for you."', 'Lời chúc bí mật: "Thế giới nhỏ này làm riêng cho bạn."'],

  // --- thông báo ---
  ['LANTERN STREET IS GLOWING!', 'PHỐ ĐÈN LỒNG SÁNG RỰC!'],
  ['ALL LANTERNS FOUND! RETURN TO THE FOX', 'ĐỦ ĐÈN RỒI! VỀ GẶP CÁO'],
  ['LANTERN FOUND!', 'TÌM THẤY ĐÈN!'],
  ['+2 COOKIES', '+2 BÁNH QUY'],
  ['FIND THIS ACCESSORY IN A TREASURE!', 'TÌM PHỤ KIỆN TRONG RƯƠNG!'],
  ['A TINY FLOWER!', 'MỘT ĐÓA HOA NHỎ!'],
  ['A flower for your garden!', 'Một đóa hoa cho vườn bạn!'],
  ['Two cookies! Very snackable.', 'Hai cái bánh! Rất ngon.'],
  ['A shiny coin bonus! +15 coins', 'Thưởng xu! +15 xu'],
  ['TREASURE FOUND!', 'TÌM THẤY KHO BÁU!'],
  ['SPLASH...', 'TÕM...'],
  ['TOO SOON!', 'VỘI QUÁ!'],
  ['FISH! +3 COINS', 'CÁ! +3 XU'],
  ['GOLDEN FISH! +18', 'CÁ VÀNG! +18'],
  ['AN OLD BOOT?!', 'CHIẾC GIÀY CŨ?!'],
  ['MYSTERY BOX! +COOKIE', 'HỘP BÍ ẨN! +BÁNH'],
  ['A BITE! REEL IT IN!', 'CÁ CẮN! KÉO LÊN!'],
  ['THE FISH GOT AWAY!', 'CÁ THOÁT RỒI!'],
  ['A SNEAKY RACCOON STOLE A COOKIE!', 'GẤU MÈO TRỘM BÁNH QUY!'],
  ['COOKIE THIEF CAUGHT! +5 COINS', 'BẮT ĐƯỢC KẺ TRỘM! +5 XU'],
  ['COOKIE RECOVERED! +5', 'LẤY LẠI BÁNH! +5'],
  ['COOKIE! +5 COINS', 'BÁNH! +5 XU'],
  ['50 COINS! GOLDEN RACCOON HAT UNLOCKED!', '50 XU! MŨ GẤU VÀNG MỞ KHÓA!'],
  ['GARDEN COMPLETE! SPECIAL FLOWER UNLOCKED', 'VƯỜN XONG! HOA ĐẶC BIỆT MỞ KHÓA'],
  ["SECRET FOUND: LAZY'S BEST FRIEND", 'BÍ MẬT: BẠN THÂN CỦA LAZY'],

  // --- tủ đồ / phòng bí mật ---
  ['RACCOON WARDROBE  (C TO CLOSE)', 'TỦ ĐỒ GẤU MÈO (C ĐỂ ĐÓNG)'],
  ['LOCKED', 'CHƯA MỞ'],
  ['THE SECRET TREE ROOM', 'PHÒNG BÍ MẬT TRONG CÂY'],
  ['A tiny cozy nook full of stars, drawings and birthday wishes. You found the quiet heart of this little world.', 'Góc nhỏ ấm áp đầy sao, tranh và lời chúc. Bạn đã tìm thấy trái tim lặng yên của thế giới này.'],
  ['"THIS LITTLE WORLD WAS MADE JUST FOR YOU."', '"THẾ GIỚI NHỎ NÀY LÀM RIÊNG CHO BẠN."'],
  ['E / SPACE TO STEP OUT', 'E / SPACE ĐỂ RA NGOÀI'],

  // --- ending ---
  ['HAPPY BIRTHDAY, LAZY!', 'CHÚC MỪNG SINH NHẬT, LAZY!'],
  ['THE WHOLE FOREST IS CELEBRATING YOU!', 'CẢ RỪNG ĐANG CHÚC MỪNG BẠN!'],
  ['A birthday letter is waiting inside.', 'Một bức thư sinh nhật đang chờ.'],
  ['...READING...', '...ĐANG ĐỌC...'],
  ['TAP / ESC TO CLOSE', 'CHẠM / ESC ĐỂ ĐÓNG'],
]);

const LETTER_VI = `Lazy thân,

Hôm nay, nhân vật chính của câu chuyện nhỏ này được kỷ niệm một tuổi mới!

Chúc bạn thật nhiều niềm vui, kỷ niệm đẹp và những người thật lòng yêu quý mình.

Cuộc sống không lúc nào dễ như một màn game. Sẽ có lúc khó khăn, vấp vã, và kế hoạch không như ý.

Nhưng đừng quên bạn quý giá thế nào. Cứ chậm rãi, tận hưởng những điều nhỏ, đừng ép mình vội vã.

Mong bạn luôn có lý do để cười, trò chơi để yêu, và bạn bè khiến ngày thường cũng đặc biệt.

Cảm ơn bạn đã truyền cảm hứng cho thế giới nhỏ này. Mỗi đóa hoa, mỗi ngôi sao, mỗi cuộc phiêu lưu đều để làm bạn mỉm cười.

Bạn xứng đáng với hạnh phúc - không chỉ hôm nay, mà mỗi ngày.

Chúc mừng sinh nhật, Lazy!

Chương tiếp theo sẽ là chương bạn thích nhất.

Với tình yêu,
Chú gấu mèo nhỏ.`;

// Các chuỗi có số / động thì dùng pattern.
const PATTERNS = [
  [/^DISCOVERED: (.*)$/, (m) => `KHÁM PHÁ: ${translate(m[1])}`],
  [/^NEXT: (.*)$/, (m) => `TIẾP: ${m[1]}`],
  [/^LANTERN ST (\d)\/3$/, (m) => `ĐÈN LỒNG ${m[1]}/3`],
  [/^G (\d+)  CK (\d+)  F (\d+)$/, (m) => `VÀNG ${m[1]}  BÁNH ${m[2]}  CÁ ${m[3]}`],
  [/^\+(\d+) COOKIES$/, (m) => `+${m[1]} BÁNH QUY`],
  [/^The (.+) is not far from here\.$/, (m) => `${translate(m[1])} ở gần đây thôi.`],
  [/^A pouch of coins! (\d+) coins$/, (m) => `Túi xu! ${m[1]} xu`],
  [/^Treasure chest (\d) opened!$/, (m) => `Mở rương ${m[1]}!`],
  [/^(\w+) ACCESSORY UNLOCKED!$/, (m) => `MỞ KHÓA PHỤ KIỆN ${m[1]}!`],
  [/^Achievement! Lazy's Best Friend - golden raccoon hat unlocked!$/, () => 'THÀNH TÍCH! Mũ gấu vàng mở khóa!'],
];

const cache = new Map();

export function translate(input) {
  const s = String(input);
  if (cache.has(s)) return cache.get(s);
  let out = s;
  if (WORDS.has(s)) out = WORDS.get(s);
  else if (WORDS.has(s.toUpperCase())) out = WORDS.get(s.toUpperCase());
  else {
    for (const [re, fn] of PATTERNS) {
      const m = s.match(re);
      if (m) { out = fn(m); break; }
    }
  }
  if (s.startsWith('Dear Lazy,')) out = LETTER_VI;
  cache.set(s, out);
  return out;
}
