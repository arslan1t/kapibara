import type { LegalBundle } from "./types";

/**
 * Uzbekistan — Uzbek law, Uzbek language.
 *
 * The same documents as ru-UZ, in Oʻzbek. Same statutes, same two admissions:
 * the database is in Ireland, and the local seller is not registered yet.
 *
 * Drafted without a practising lawyer. Must be reviewed by Uzbek counsel
 * before the Uzbek storefront takes a real order.
 */
export const uzUZ: LegalBundle = {
  version: "2026-11-17",
  privacy: {
    title: "Shaxsiy maʼlumotlarni qayta ishlash siyosati",
    intro:
      "Oʻzbekistonda qanday maʼlumotlarni toʻplaymiz, ular nima uchun kerak, qayerda saqlanadi va qanday oʻchiriladi.",
    scope: "{site} saytining Oʻzbekiston Respublikasidagi xaridorlari uchun",
    sections: [
      {
        heading: "Umumiy qoidalar",
        clauses: [
          {
            body: "Shaxsiy maʼlumotlar egasi — {seller}, {taxIdLabel} {taxId}, {registrationIdLabel} {registrationId}, {registeredOn} dan, keyingi oʻrinlarda «Operator». Siyosat Oʻzbekiston Respublikasining 02.07.2019-yildagi OʻRQ-547-son «Shaxsga doir maʼlumotlar toʻgʻrisida»gi Qonuniga muvofiq tuzilgan.",
          },
          {
            body: "Siyosat Operator {site} sayti tashrifchilaridan roʻyxatdan oʻtishda, buyurtma rasmiylashtirishda, qoʻllab-quvvatlashga murojaat qilishda va bildirishnomalarga obuna boʻlishda oladigan maʼlumotlarga taalluqli.",
          },
          {
            body: "Saytdan foydalanish orqali siz ushbu Siyosat bilan tanishganingizni tasdiqlaysiz. Maʼlumotlarni qayta ishlashga rozilik aniq harakat bilan — roʻyxatdan oʻtish yoki buyurtma shaklida belgi qoʻyish bilan olinadi va istalgan vaqtda qaytarib olinishi mumkin.",
          },
          {
            body: "Amaldagi tahrir doim shu sahifada joylashgan. Tahrir sanasi yuqorida koʻrsatilgan; oʻzgarishlar eʼlon qilingan paytdan kuchga kiradi.",
          },
        ],
      },
      {
        heading: "Qanday maʼlumotlar qayta ishlanadi",
        clauses: [
          {
            title: "Xaridor maʼlumotlari",
            body: "Familiya va ism, elektron pochta manzili, telefon raqami, yetkazib berish manzili, buyurtma tarkibi va summasi, buyurtmalar tarixi, buyurtmaga izoh.",
          },
          {
            title: "Bola maʼlumotlari",
            body: "Bolaning ismi, yoshi va siz yuklagan fotosurat — ular aynan siz buyurtma qilgan kitobni tayyorlash uchun kerak. Bola haqida boshqa hech narsa soʻralmaydi va toʻplanmaydi.",
          },
          {
            title: "Texnik maʼlumotlar",
            body: "IP-manzil, qurilma va brauzer turi, sayt sahifalari va murojaat vaqti — ular avtomatik yoziladi va saytning ishlashi hamda suiisteʼmollikdan himoya uchun kerak.",
          },
          {
            body: "Operator OʻRQ-547 3-moddasi maʼnosida biometrik shaxsiy maʼlumotlarni qayta ishlamaydi: fotosurat rasm uchun tasviriy material sifatida ishlatiladi va shaxsni aniqlash uchun qoʻllanmaydi.",
          },
        ],
      },
      {
        heading: "Qayta ishlash maqsadlari",
        clauses: [
          {
            body: "Shartnomani bajarish: buyurtmani rasmiylashtirish va tasdiqlash, shaxsiy kitobni tayyorlash, yetkazib berish, murojaatlarni qabul qilish va koʻrib chiqish.",
          },
          {
            body: "Shaxsiy kabinetni yuritish: hisobga kirish, buyurtmalar tarixi, parolni tiklash.",
          },
          {
            body: "Oʻzbekiston Respublikasi qonunchiligi talablarini bajarish, shu jumladan tuzilgan bitimlar haqidagi maʼlumotlarni saqlash.",
          },
          {
            body: "Buyurtma holati haqidagi axborot xabarlari. Reklama xabarlari faqat alohida rozilik bilan va bir bosishda voz kechish imkoniyati bilan yuboriladi.",
          },
        ],
      },
      {
        heading: "Huquqiy asoslar",
        clauses: [
          {
            body: "Shaxsiy maʼlumotlar subyektining roziligi — OʻRQ-547 16-moddasi. Rozilik alohida harakat bilan beriladi va siz koʻrgan hujjat sanasi hamda tahriri bilan birga qayd etiladi.",
          },
          {
            body: "Subyekt tomoni boʻlgan shartnomani bajarish — bularsiz buyurtmani tayyorlab va yetkazib boʻlmaydigan maʼlumotlar uchun.",
          },
          {
            body: "Oʻzbekiston Respublikasi qonunchiligi Operator zimmasiga yuklagan majburiyatlarni bajarish.",
          },
        ],
      },
      {
        heading: "Maʼlumotlar kimga beriladi",
        clauses: [
          {
            body: "Yetkazib berish xizmatiga — qabul qiluvchining ismi, telefoni va manzili, joʻnatmani topshirish uchun zarur hajmda.",
          },
          {
            body: "Bosmaxonaga — bolaning ismi va yuklangan fotosurat asosida yaratilgan rasmlarni oʻz ichiga olgan kitob maketi.",
          },
          {
            body: "Rasm yaratish xizmati provayderiga — bolaning yuklangan fotosurati va ismi. Bu kitob tayyorlashning zaruriy qismi; tasvirni bermasdan rasm yaratib boʻlmaydi.",
          },
          {
            body: "Hosting, fayl ombori va elektron pochta provayderlariga — texnik qayta ishlashda yuzaga keladigan hajmda. Operator shaxsiy maʼlumotlarni sotmaydi va begona reklama uchun bermaydi.",
          },
        ],
      },
      {
        heading: "Maʼlumotlar qayerda saqlanadi",
        clauses: [
          {
            body: "Saytning oʻzbek versiyasi maʼlumotlar bazasi va fayl ombori Oʻzbekiston Respublikasidagi serverlarda joylashgan. Oʻzbekistondagi xaridorlarning shaxsiy maʼlumotlari, shu jumladan bolalarning fotosuratlari, mamlakat tashqarisiga chiqarilmaydi.",
          },
          {
            body: "Bu OʻRQ-547 27-1-moddasining Oʻzbekiston Respublikasi fuqarolarining shaxsiy maʼlumotlarini respublika hududida jismonan joylashgan maʼlumotlar bazalaridan foydalangan holda qayta ishlash talabini bajaradi.",
          },
          {
            body: "Saytning rus versiyasi alohida infratuzilmada ishlaydi va alohida maʼlumotlar bazasiga xizmat qiladi. Oʻzbekistondagi xaridorlar maʼlumotlari unga tushmaydi va aksincha.",
          },
          {
            body: "Istisno — yuklangan fotosurat asosida rasm yaratadigan xizmat: u Oʻzbekiston Respublikasidan tashqarida joylashgan va buyurtmani bajarish uchun fotosurat unga uzatiladi. Bunday uzatishsiz shaxsiy rasm yaratib boʻlmaydi. Uzatish ushbu Siyosatda tavsiflangan boʻlib, unga rozilik roʻyxatdan oʻtishda va buyurtma rasmiylashtirishda tasdiqlanadi.",
          },
        ],
      },
      {
        heading: "Saqlash muddatlari",
        clauses: [
          {
            body: "Hisob maʼlumotlari hisob mavjud boʻlgunicha saqlanadi. Hisob oʻchirilgandan soʻng ular oʻchiriladi, qonun boʻyicha saqlash majburiy boʻlgan maʼlumotlar bundan mustasno.",
          },
          {
            body: "Buyurtma va bitim maʼlumotlari Oʻzbekiston Respublikasining buxgalteriya hisobi va soliqqa tortish toʻgʻrisidagi qonunchiligida belgilangan muddatlarda saqlanadi.",
          },
          {
            body: "Bolaning fotosurati yopiq omborda saqlanadi va faqat sizning kitobingizni tayyorlash uchun ishlatiladi. Avtomatik oʻchirish amalga oshirilmagan: soʻrovingiz boʻyicha fotosuratni qoʻlda oʻchiramiz va buni xat bilan tasdiqlaymiz.",
          },
        ],
      },
      {
        heading: "Sizning huquqlaringiz",
        clauses: [
          {
            body: "Maʼlumotlaringizni qayta ishlash, ularning tarkibi va maqsadlari haqida maʼlumot olish — OʻRQ-547 22-moddasi.",
          },
          {
            body: "Maʼlumotlar toʻliq boʻlmasa, eskirgan, notoʻgʻri yoki qonunga xilof olingan boʻlsa, ularni aniqlashtirish, bloklash yoki yoʻq qilishni talab qilish.",
          },
          {
            body: "Rozilikni qaytarib olish. Qaytarib olingandan soʻng Operator qayta ishlashni toʻxtatadi, maʼlumotlar allaqachon qabul qilingan buyurtmani bajarish uchun zarur boʻlgan yoki qonun boʻyicha saqlash majburiy boʻlgan hollar bundan mustasno.",
          },
          {
            body: "Huquqlaringiz buzilgan deb hisoblasangiz, Axborotlashtirish va telekommunikatsiyalar sohasida nazorat boʻyicha davlat inspeksiyasiga yoki sudga murojaat qilishingiz mumkin. Operatorga soʻrovlarni {email} manziliga yuboring — javob qonunda belgilangan muddatda beriladi.",
          },
        ],
      },
      {
        heading: "Maʼlumotlarni qanday himoya qilamiz",
        clauses: [
          {
            body: "Sayt bilan ulanish shifrlangan (HTTPS). Parollar qaytarib boʻlmaydigan xeshlar koʻrinishida saqlanadi va xodimlarga koʻrinmaydi.",
          },
          {
            body: "Fotosuratlar va maketlar yopiq omborda yotadi va faqat kirish huquqi tekshirilgandan soʻng vaqtinchalik havolalar orqali beriladi.",
          },
          {
            body: "Xodimlarning kirish huquqi aniq buyurtma ustida ishlash uchun zarur boʻlgan maʼlumotlar bilan cheklangan.",
          },
        ],
      },
      {
        heading: "Oʻzgarishlar va aloqa",
        clauses: [
          {
            body: "Operator Siyosatni oʻzgartirishga haqli. Yangi tahrir shu sahifada eʼlon qilinadi, tahrir sanasi yangilanadi.",
          },
          {
            body: "Shaxsiy maʼlumotlarni qayta ishlash boʻyicha savollar: {email}, telefon {phone}.",
          },
        ],
      },
    ],
  },

  terms: {
    title: "Foydalanuvchi shartnomasi",
    intro: "Sayt va shaxsiy kabinetdan foydalanish shartlari.",
    scope:
      "{site} saytining Oʻzbekiston Respublikasidagi foydalanuvchilari uchun",
    sections: [
      {
        heading: "Tomonlar va atamalar",
        clauses: [
          {
            body: "Shartnoma {seller}, {taxIdLabel} {taxId}, keyingi oʻrinlarda «Sotuvchi», va {site} saytidan foydalanadigan har qanday shaxs, keyingi oʻrinlarda «Foydalanuvchi», oʻrtasida tuziladi.",
          },
          {
            body: "«Sayt» — {site} internet resursi va uning barcha sahifalari. «Tovar» — Foydalanuvchining individual buyurtmasi boʻyicha tayyorlanadigan shaxsiy bolalar kitobi.",
          },
          {
            body: "Saytdan foydalanish ushbu Shartnomaga rozilik bildirishni anglatadi. Agar biror shart bilan rozi boʻlmasangiz, saytdan foydalanmaslik lozim.",
          },
        ],
      },
      {
        heading: "Shartnoma predmeti",
        clauses: [
          {
            body: "Sotuvchi Foydalanuvchiga sayt, tovarlar katalogi, shaxsiylashtirish konstruktori va shaxsiy kabinetdan foydalanish imkonini beradi.",
          },
          {
            body: "Tovarni xarid qilish shartlari saytda joylashtirilgan ommaviy oferta bilan belgilanadi. Ushbu Shartnoma oldi-sotdi shartnomasini emas, saytdan foydalanishni tartibga soladi.",
          },
          {
            body: "Saytdan foydalanish bepul. Tovarlar narxi katalogda koʻrsatilgan.",
          },
        ],
      },
      {
        heading: "Roʻyxatdan oʻtish va hisob",
        clauses: [
          {
            body: "Buyurtma berish uchun roʻyxatdan oʻtish majburiy emas, lekin buyurtmalar tarixi va saqlangan maʼlumotlarga kirish uchun zarur.",
          },
          {
            body: "Foydalanuvchi ishonchli maʼlumotlarni koʻrsatadi va parolning saqlanishi uchun javob beradi. Hisobdan amalga oshirilgan barcha harakatlar Foydalanuvchi tomonidan amalga oshirilgan hisoblanadi.",
          },
          {
            body: "Hisob yaratishga zarur muomala layoqatiga ega shaxs haqli. Bola uchun buyurtmani ota-ona yoki boshqa qonuniy vakil rasmiylashtiradi.",
          },
          {
            body: "Sotuvchi ushbu Shartnoma buzilganda hisobni bloklashga haqli, bu haqda Foydalanuvchini oldindan ogohlantiradi — zudlik bilan chora talab qiladigan hollar bundan mustasno.",
          },
        ],
      },
      {
        heading: "Siz yuklaydigan materiallar",
        clauses: [
          {
            body: "Fotosuratni yuklash orqali Foydalanuvchi undan foydalanish huquqiga ega ekanini va tasvirlangan bolaning ota-onasi yoki qonuniy vakili ekanini yoxud ularning roziligini olganini tasdiqlaydi.",
          },
          {
            body: "Foydalanuvchi Sotuvchiga fotosuratdan faqat buyurtma qilingan kitobni tayyorlash uchun foydalanish huquqini beradi: qayta ishlash, rasm yaratish va chop etish.",
          },
          {
            body: "Sotuvchi yuklangan fotosuratlarni eʼlon qilmaydi, reklamada ishlatmaydi va uchinchi shaxslarga bermaydi — buyurtmani tayyorlashda qatnashadigan ijrochilar bundan mustasno.",
          },
          {
            body: "Uchinchi shaxslar huquqlarini yoki Oʻzbekiston Respublikasi qonunchiligini buzadigan materiallarni yuklash taqiqlanadi. Bunday buyurtmalar bekor qilinadi, toʻlangan summalar qaytariladi.",
          },
        ],
      },
      {
        heading: "Intellektual mulk",
        clauses: [
          {
            body: "Hikoyalar matni, rasmlar, sayt dizayni va tovar belgilari Sotuvchiga tegishli va Oʻzbekiston Respublikasining mualliflik huquqi toʻgʻrisidagi qonunchiligi bilan himoyalangan.",
          },
          {
            body: "Kitobni sotib olgan Foydalanuvchi asar nusxasini shaxsiy foydalanish uchun oladi. Koʻpaytirish, eʼlon qilish va qayta ishlash huquqlari berilmaydi.",
          },
          {
            body: "Kitobning shaxsiy elementlari — bolaning ismi va tasviri — Foydalanuvchining maʼlumotlari boʻlib qoladi va faqat buyurtma doirasida ishlatiladi.",
          },
        ],
      },
      {
        heading: "Cheklovlar",
        clauses: [
          {
            body: "Saytning ishiga aralashish, texnik cheklovlarni chetlab oʻtish, maʼlumotlarni avtomatlashtirilgan tarzda yigʻish va haddan ortiq yuklama yaratish taqiqlanadi.",
          },
          {
            body: "Oʻzini boshqa shaxs sifatida koʻrsatish va buyurtma rasmiylashtirishda begona maʼlumotlardan foydalanish taqiqlanadi.",
          },
          {
            body: "Ushbu qoidalar buzilganda Sotuvchi kirishni cheklashga haqli.",
          },
        ],
      },
      {
        heading: "Javobgarlik",
        clauses: [
          {
            body: "Sayt «qanday boʻlsa shundayligicha» taqdim etiladi. Sotuvchi uning uzluksiz ishlashi uchun oqilona saʼy-harakat qiladi, biroq texnik uzilishlar boʻlmasligiga kafolat bermaydi.",
          },
          {
            body: "Sotuvchi Foydalanuvchi ishonchsiz maʼlumot koʻrsatishi oqibatlari, shu jumladan notoʻgʻri manzilga yetkazib berish uchun javob bermaydi.",
          },
          {
            body: "Sotuvchining tovar nuqsonlari uchun javobgarligi Oʻzbekiston Respublikasining «Isteʼmolchilar huquqlarini himoya qilish toʻgʻrisida»gi Qonuni va ommaviy oferta bilan belgilanadi.",
          },
        ],
      },
      {
        heading: "Oʻzgarishlar va bekor qilish",
        clauses: [
          {
            body: "Sotuvchi Shartnomani oʻzgartirishga haqli. Yangi tahrir shu sahifada eʼlon qilinadi; saytdan foydalanishni davom ettirish unga rozilik bildirishni anglatadi.",
          },
          {
            body: "Foydalanuvchi istalgan vaqtda saytdan foydalanishni toʻxtatishi va {email} manziliga murojaat qilib hisobini oʻchirishi mumkin.",
          },
          {
            body: "Hisobni oʻchirish allaqachon rasmiylashtirilgan va bajarilmagan buyurtmalar boʻyicha majburiyatlarni bekor qilmaydi.",
          },
        ],
      },
      {
        heading: "Qoʻllaniladigan huquq va nizolar",
        clauses: [
          {
            body: "Ushbu Shartnomaga Oʻzbekiston Respublikasi qonunchiligi qoʻllaniladi.",
          },
          {
            body: "Nizolar muzokaralar yoʻli bilan hal qilinadi; kelishuvga erishilmasa — Oʻzbekiston Respublikasi qonunchiligida belgilangan tartibda.",
          },
        ],
      },
    ],
  },

  offer: {
    title: "Ommaviy oferta",
    intro: "Oʻzbekistonda shaxsiy kitob xarid qilish shartlari.",
    scope:
      "{site} saytida rasmiylashtirilgan va Oʻzbekiston Respublikasi boʻylab yetkaziladigan buyurtmalar uchun",
    sections: [
      {
        heading: "Umumiy qoidalar",
        clauses: [
          {
            body: "Ushbu hujjat Oʻzbekiston Respublikasi Fuqarolik kodeksining 367-moddasiga muvofiq {seller}, {taxIdLabel} {taxId}, {registrationIdLabel} {registrationId}, {registeredOn} dan, keyingi oʻrinlarda «Sotuvchi», ning ommaviy ofertasi hisoblanadi.",
          },
          {
            body: "Saytda buyurtma rasmiylashtirish Oʻzbekiston Respublikasi Fuqarolik kodeksining 369-moddasi maʼnosida ofertani aksept qilish deb eʼtirof etiladi va quyida bayon etilgan shartlarda shartnoma tuzilganini anglatadi.",
          },
          {
            body: "Tomonlar munosabatlari shuningdek Oʻzbekiston Respublikasining «Isteʼmolchilar huquqlarini himoya qilish toʻgʻrisida»gi Qonuni va 29.09.2022-yildagi OʻRQ-792-son «Elektron tijorat toʻgʻrisida»gi Qonuni bilan tartibga solinadi.",
          },
        ],
      },
      {
        heading: "Shartnoma predmeti",
        clauses: [
          {
            body: "Sotuvchi individual buyurtma boʻyicha tayyorlangan shaxsiy bolalar kitobini tayyorlash va Xaridorga topshirish, Xaridor esa uni qabul qilish va toʻlash majburiyatini oladi.",
          },
          {
            body: "Tovarning individual xususiyatlari Xaridor buyurtma rasmiylashtirishda koʻrsatgan maʼlumotlar bilan belgilanadi: bolaning ismi, yoshi, fotosurati va bagʻishlov matni.",
          },
          {
            body: "Tovar tavsiflari — sahifalar soni, format, muqova va qogʻoz turi — saytdagi tovar kartochkasida koʻrsatilgan.",
          },
        ],
      },
      {
        heading: "Buyurtmani rasmiylashtirish va tasdiqlash",
        clauses: [
          {
            body: "Xaridor kitobni tanlaydi, shaxsiylashtirish maʼlumotlarini toʻldiradi hamda aloqa maʼlumotlari va yetkazib berish manzilini koʻrsatadi.",
          },
          {
            body: "Buyurtmadan oldin Xaridorga dastlabki maket koʻrsatiladi. Xaridor bolaning ismini va qolgan maʼlumotlarni tekshirishi shart: chop etishga yuborilgandan soʻng oʻzgartirish kiritib boʻlmaydi.",
          },
          {
            body: "Buyurtma Sotuvchi tomonidan tasdiqlangandan soʻng qabul qilingan hisoblanadi. Sotuvchi Xaridor bilan bogʻlanadi, buyurtma tarkibini, yetkazib berish bilan birga yakuniy summani va muddatlarni tasdiqlaydi.",
          },
          {
            body: "Maʼlumotlar ishonchsiz boʻlsa, yuklangan materiallar uchinchi shaxslar huquqlarini buzsa yoki tovarni texnik sabablarga koʻra tayyorlab boʻlmasa, Sotuvchi buyurtmani bajarishdan bosh tortishga haqli. Bunda toʻlangan summalar toʻliq qaytariladi.",
          },
        ],
      },
      {
        heading: "Narx va toʻlov",
        clauses: [
          {
            body: "Tovar narxi katalogda Oʻzbekiston Respublikasi soʻmida koʻrsatilgan va qonunchilikda nazarda tutilgan barcha majburiy toʻlovlarni oʻz ichiga oladi.",
          },
          {
            body: "Yetkazib berish narxi tovar narxiga kirmaydi va buyurtma tasdiqlanayotganda manzil va yetkazib berish usulidan kelib chiqib alohida hisoblanadi.",
          },
          {
            body: "Toʻlov Payme va Click toʻlov tizimlari orqali — UZCARD, HUMO, Visa va Mastercard bank kartalari yoki tegishli tizim ilovasi orqali amalga oshiriladi. Toʻlov usulini Xaridor buyurtma rasmiylashtirishda tanlaydi.",
          },
          {
            body: "Bank kartasi maʼlumotlari toʻlov tizimi tomonida kiritiladi. Sotuvchi karta rekvizitlarini olmaydi, qayta ishlamaydi va saqlamaydi.",
          },
          {
            body: "Agar birorta toʻlov tizimi ulanmagan boʻlsa, sayt rasmiylashtirish paytida bu haqda ochiq xabar beradi va toʻlov buyurtma tasdiqlangandan soʻng Xaridor bilan kelishiladi. Shu paytgacha pul mablagʻlari yechilmaydi.",
          },
        ],
      },
      {
        heading: "Tayyorlash va yetkazib berish",
        clauses: [
          {
            body: "Har bir kitob aniq buyurtma uchun alohida chop etiladi. Tayyorlash muddati buyurtma tasdiqlanayotganda xabar qilinadi.",
          },
          {
            body: "Toshkent shahri boʻylab yetkazib berish kuryer orqali, Oʻzbekiston Respublikasining boshqa hududlariga — pochta yoki kuryerlik xizmati orqali amalga oshiriladi. Muddatlar tanlangan xizmat va aholi punktiga bogʻliq.",
          },
          {
            body: "Tovarning tasodifan yoʻqolishi yoki shikastlanishi xavfi tovar Xaridorga yoki u koʻrsatgan shaxsga topshirilgan paytdan Xaridorga oʻtadi.",
          },
        ],
      },
      {
        heading: "Qaytarish va almashtirish",
        clauses: [
          {
            body: "Tovar Xaridorning individual buyurtmasi boʻyicha tayyorlanadi va individual belgilangan xususiyatlarga ega: aniq bir bolaning ismi va tasviri. Bunday sifatli tovar almashtirilmaydi va qaytarilmaydi.",
          },
          {
            body: "Bu cheklov sifatsiz tovarga taalluqli emas. Ishlab chiqarish nuqsoni, yetkazib berishda shikastlanish yoki kelishilgan maketga mos kelmaslik holatida Xaridor Oʻzbekiston Respublikasining «Isteʼmolchilar huquqlarini himoya qilish toʻgʻrisida»gi Qonuniga muvofiq almashtirish yoki toʻlangan summani qaytarishni talab qilishga haqli.",
          },
          {
            body: "Nuqson haqida {email} manziliga fotosuratlar ilova qilib xabar berish lozim. Sotuvchi murojaatni koʻrib chiqadi va qarorni qonunchilikda belgilangan muddatda maʼlum qiladi.",
          },
          {
            body: "Nuqsonli nusxani almashtirish Sotuvchi hisobidan, shu jumladan qaytarib joʻnatish xarajatlari bilan birga amalga oshiriladi.",
          },
        ],
      },
      {
        heading: "Javobgarlik va nizolar",
        clauses: [
          {
            body: "Sotuvchi Xaridor ishonchsiz maʼlumot taqdim etishi oqibatlari, shu jumladan maketni tekshirish bosqichida Xaridor tomonidan tasdiqlangan bolaning ismidagi xato uchun javob bermaydi.",
          },
          {
            body: "Tomonlar yengib boʻlmas kuch holatlarida javobgarlikdan ozod qilinadi.",
          },
          {
            body: "Nizolar muzokaralar yoʻli bilan, kelishuvga erishilmasa — Oʻzbekiston Respublikasi qonunchiligida belgilangan tartibda hal qilinadi.",
          },
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie fayllardan foydalanish",
    intro:
      "Sayt qanday cookie fayllardan foydalanadi va ularni qanday boshqarish mumkin.",
    scope: "{site} sayti va uning barcha sahifalari uchun",
    sections: [
      {
        heading: "Cookie nima",
        clauses: [
          {
            body: "Cookie — sayt brauzeringizda saqlaydigan kichik matnli fayl. U keyingi murojaatda brauzerni tanib olish imkonini beradi.",
          },
          {
            body: "Cookie fayllarning oʻzida ismingiz yoki manzilingiz boʻlmaydi. Hisob maʼlumotlari bilan birgalikda ular sizga taalluqli boʻlishi mumkin, shuning uchun OʻRQ-547 maʼnosida shaxsiy maʼlumot sifatida koʻriladi.",
          },
          {
            body: "Sayt cookie fayllardan faqat quyida tavsiflangan hajmda foydalanadi.",
          },
        ],
      },
      {
        heading: "Qanday fayllardan foydalanamiz",
        clauses: [
          {
            title: "Zaruriy",
            body: "Hisobga kirish seansini, savat tarkibini, tanlangan mamlakat va tilni saqlaydi hamda shakllarni avtomatik yuborishdan himoya qiladi. Ularsiz sayt ishlamaydi, shuning uchun ular doim oʻrnatiladi.",
          },
          {
            title: "Tahliliy",
            body: "Qaysi sahifalardan foydalanilayotganini va tashrifchilar qayerda qiyinchilikka duch kelayotganini tushunishga yordam beradi. Faqat sizning roziligingizdan soʻng oʻrnatiladi.",
          },
          {
            title: "Reklama",
            body: "Ishlatilmaydi. Sayt uchinchi shaxslarning reklama va kuzatuv pikselarini joylashtirmaydi.",
          },
          {
            body: "Saqlash muddati faylning vazifasiga bogʻliq: bir seansdan bir yilgacha.",
          },
        ],
      },
      {
        heading: "Rozilik",
        clauses: [
          {
            body: "Birinchi tashrifda teng ahamiyatli tanlov bilan banner koʻrsatiladi: barcha fayllarni qabul qilish yoki faqat zaruriylarini.",
          },
          {
            body: "Tanlovingiz saqlanadi va keyingi tashriflarda qoʻllanadi. Uni istalgan vaqtda sayt pastidagi «Cookie sozlamalari» havolasi orqali oʻzgartirish mumkin.",
          },
          {
            body: "Tahliliy cookie fayllardan voz kechish saytga kirishni cheklamaydi va buyurtma rasmiylashtirishga taʼsir qilmaydi.",
          },
        ],
      },
      {
        heading: "Brauzerda cookie boshqaruvi",
        clauses: [
          {
            body: "Barcha keng tarqalgan brauzerlar maxfiylik sozlamalarida saqlangan cookie fayllarni oʻchirish va ularni oʻrnatishni taqiqlash imkonini beradi.",
          },
          {
            body: "Cookie fayllarni butunlay taqiqlash hisobga kirish va buyurtma berishni imkonsiz qiladi: savat va seans aynan ularda saqlanadi.",
          },
          {
            body: "Cookie fayllardan foydalanish boʻyicha savollar: {email}.",
          },
        ],
      },
      {
        heading: "Oʻzgarishlar",
        clauses: [
          {
            body: "Ishlatiladigan fayllar roʻyxati oʻzgarishi mumkin. Yangi tahrir yangilangan sana bilan shu sahifada eʼlon qilinadi.",
          },
          {
            body: "Jiddiy oʻzgarishlar rozilikni qayta soʻrash bilan birga boʻladi.",
          },
        ],
      },
    ],
  },

  labels: {
    edition: "Tahrir",
    appliesTo: "Amal qiladi",
    detailsHeading: "Rekvizitlar",
    seller: "Sotuvchi",
    taxId: "JSHSHIR (PINFL)",
    registrationId: "Oʻzini oʻzi band qilganlik maʼlumotnomasi №",
    registeredOn: "{registeredOn} da berilgan",
    address: "Manzil",
    email: "Elektron pochta",
    phone: "Telefon",
    detailsPending:
      "Ushbu bozor uchun sotuvchi rekvizitlari hali kiritilmagan. Hujjat tanishish uchun joylashtirilgan va ular koʻrsatilgunga qadar ommaviy oferta hisoblanmaydi.",
    notSet: "[koʻrsatilmagan]",
  },
};
