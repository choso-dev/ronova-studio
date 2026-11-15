// Textos que escribe el JavaScript en cada idioma (es, en, ja): botones, cursor, intro,
// el torniquete del verificador y las conversaciones de ejemplo del agente de IA.
// Los textos fijos del HTML están en idiomas/en/ e idiomas/ja/ (los aplica scripts/idiomas.js).
(function (global, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else global.RONOVA_TEXTOS = fabrica();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    es: {
      menu: 'menú',
      cerrar: 'cerrar',
      sonido: 'sonido',
      silencio: 'silencio',
      saltarIntro: 'saltar intro',
      deslizaArriba: 'desliza hacia arriba',
      deslizaRecorrer: 'desliza para recorrer',
      pestanaEspera: 'ロノ · tu web te espera',
      copiar: 'Copiar {x}',
      copiado: 'copiado ✓',
      cursor: { entrar: 'entrar', voltear: 'voltear', hablemos: 'hablemos', arrastra: 'arrastra' },
      lineasCodigo: [
        'const idea = escuchar(cliente);',
        'const boceto = dibujar(idea, { marca, colores });',
        'function construir(boceto) {',
        '  return codigo(boceto).probar().pulir();',
        '}',
        '// una idea convertida en software',
        'publicar(construir(boceto));',
        'if (funciona) celebrar();',
        'while (crece) mejorar(producto);',
        'export default ronova;',
      ],
      chat: { escribiendo: 'escribiendo…', enLinea: 'en línea · ' },
      noches: {
        whatsapp: [
          ['11:58', 'p.m.', [['cliente', 'Hola, ¿tienen cupo mañana para un corte a domicilio?'], ['agente', '¡Hola! Sí: 10:00 a.m. o 4:00 p.m. ¿Cuál prefieres?'], ['cliente', 'A las 4, en Chacao 🙌']]],
          ['2:47', 'a.m.', [['cliente', '¿Cuánto cuesta el corte con barba?'], ['agente', 'Corte + barba: $12. Aceptamos Pago Móvil y efectivo.']]],
          ['5:30', 'a.m.', [['cliente', 'Buenas, ¿hacen envíos a Los Teques?'], ['agente', 'Sí, a partir de las 8:00 a.m. ¿Te reservo uno?']]],
        ],
        instagram: [
          ['12:20', 'a.m.', [['cliente', 'Vi tu publicación, ¿cómo agendo una consulta?'], ['agente', '¡Hola! ¿Es para un bebé, un niño o para ti?'], ['cliente', 'Para mi bebé de 8 meses']]],
          ['3:05', 'a.m.', [['cliente', '¿Atienden los sábados?'], ['agente', 'Sí, de 8:00 a.m. a 12:00 m. Te paso el enlace para elegir hora.']]],
          ['6:10', 'a.m.', [['cliente', '¿El tratamiento facial cuánto dura?'], ['agente', 'Unos 45 minutos. ¿Quieres que te aparte un cupo esta semana?']]],
        ],
      },
      verificador: {
        leyendo: 'leyendo…',
        buscando: 'buscando la referencia en el banco',
        casos: {
          ok: { ref: 'Ref 004812', monto: 'Bs 1.250,00', kanji: '確認済', msg: 'verificado', detalle: 'el pago entró al banco: puede pasar' },
          usado: { ref: 'Ref 003377', monto: 'Bs 480,00', kanji: '使用済', msg: 'ya usado', detalle: 'esa referencia ya se verificó antes' },
          no: { ref: 'Ref 009150', monto: 'Bs 2.100,00', kanji: '未着', msg: 'no encontrado', detalle: 'ese pago todavía no llega al banco' },
        },
      },
    },

    en: {
      menu: 'menu',
      cerrar: 'close',
      sonido: 'sound',
      silencio: 'muted',
      saltarIntro: 'skip intro',
      deslizaArriba: 'swipe up',
      deslizaRecorrer: 'scroll to explore',
      pestanaEspera: 'ロノ · your website awaits',
      copiar: 'Copy {x}',
      copiado: 'copied ✓',
      cursor: { entrar: 'enter', voltear: 'flip', hablemos: "let's talk", arrastra: 'drag' },
      lineasCodigo: [
        'const idea = listen(client);',
        'const sketch = draw(idea, { brand, colors });',
        'function build(sketch) {',
        '  return code(sketch).test().polish();',
        '}',
        '// an idea turned into software',
        'launch(build(sketch));',
        'if (itWorks) celebrate();',
        'while (growing) improve(product);',
        'export default ronova;',
      ],
      chat: { escribiendo: 'typing…', enLinea: 'online · ' },
      noches: {
        whatsapp: [
          ['11:58', 'PM', [['cliente', 'Hi! Do you have an opening tomorrow for a house-call haircut?'], ['agente', 'Hi! Yes: 10:00 AM or 4:00 PM. Which works better for you?'], ['cliente', '4 PM, downtown 🙌']]],
          ['2:47', 'AM', [['cliente', 'How much is a haircut + beard trim?'], ['agente', 'Haircut + beard is $25. We take card, transfer and cash.']]],
          ['5:30', 'AM', [['cliente', 'Morning! Do you deliver to the north side?'], ['agente', 'Yes, starting at 8:00 AM. Want me to set one aside for you?']]],
        ],
        instagram: [
          ['12:20', 'AM', [['cliente', 'Saw your post—how do I book a consultation?'], ['agente', 'Hi! Is it for a baby, a child or for you?'], ['cliente', 'For my 8-month-old baby']]],
          ['3:05', 'AM', [['cliente', 'Are you open on Saturdays?'], ['agente', 'Yes, from 8:00 AM to 12:00 PM. Here is the link to pick a time.']]],
          ['6:10', 'AM', [['cliente', 'How long does the facial treatment take?'], ['agente', 'About 45 minutes. Would you like me to save you a spot this week?']]],
        ],
      },
      verificador: {
        leyendo: 'reading…',
        buscando: 'checking the reference with the bank',
        casos: {
          ok: { ref: 'Ref 004812', monto: 'Bs 1.250,00', kanji: '確認済', msg: 'verified', detalle: 'the payment reached the bank: good to go' },
          usado: { ref: 'Ref 003377', monto: 'Bs 480,00', kanji: '使用済', msg: 'already used', detalle: 'that reference was already verified before' },
          no: { ref: 'Ref 009150', monto: 'Bs 2.100,00', kanji: '未着', msg: 'not found', detalle: "that payment hasn't reached the bank yet" },
        },
      },
    },

    ja: {
      menu: 'メニュー',
      cerrar: '閉じる',
      sonido: 'サウンド',
      silencio: 'ミュート',
      saltarIntro: 'スキップ',
      deslizaArriba: '上にスワイプ',
      deslizaRecorrer: 'スクロールして進む',
      pestanaEspera: 'ロノ · あなたのサイトが待っています',
      copiar: '{x} をコピー',
      copiado: 'コピー済み ✓',
      cursor: { entrar: '入る', voltear: '裏返す', hablemos: '話そう', arrastra: 'ドラッグ' },
      lineasCodigo: [
        'const idea = listen(client);',
        'const sketch = draw(idea, { brand, colors });',
        'function build(sketch) {',
        '  return code(sketch).test().polish();',
        '}',
        '// アイデアを、ソフトウェアに',
        'launch(build(sketch));',
        'if (itWorks) celebrate();',
        'while (growing) improve(product);',
        'export default ronova;',
      ],
      chat: { escribiendo: '入力中…', enLinea: 'オンライン · ' },
      noches: {
        whatsapp: [
          ['11:58', 'PM', [['cliente', 'こんばんは！明日、出張カットの空きはありますか？'], ['agente', 'こんばんは！はい、10:00と16:00が空いています。どちらがよろしいですか？'], ['cliente', '16:00でお願いします 🙌']]],
          ['2:47', 'AM', [['cliente', 'カットと髭剃りでいくらですか？'], ['agente', 'セットで $25 です。カード・振込・現金に対応しています。']]],
          ['5:30', 'AM', [['cliente', 'おはようございます。配達はしていますか？'], ['agente', 'はい、朝8時から配達しています。お取り置きしましょうか？']]],
        ],
        instagram: [
          ['12:20', 'AM', [['cliente', '投稿を見ました。診察の予約はどうすればいいですか？'], ['agente', 'こんにちは！赤ちゃん・お子さま・ご本人のどなたの診察ですか？'], ['cliente', '生後8か月の赤ちゃんです']]],
          ['3:05', 'AM', [['cliente', '土曜日も診てもらえますか？'], ['agente', 'はい、8:00〜12:00まで診療しています。時間を選べるリンクをお送りしますね。']]],
          ['6:10', 'AM', [['cliente', 'フェイシャルは何分くらいかかりますか？'], ['agente', '45分ほどです。今週のご予約をお取りしましょうか？']]],
        ],
      },
      verificador: {
        leyendo: '読み取り中…',
        buscando: '銀行で参照番号を照合しています',
        casos: {
          ok: { ref: 'Ref 004812', monto: 'Bs 1.250,00', kanji: '確認済', msg: '確認済み', detalle: '銀行への着金を確認：通過できます' },
          usado: { ref: 'Ref 003377', monto: 'Bs 480,00', kanji: '使用済', msg: '使用済み', detalle: 'この参照番号はすでに確認されています' },
          no: { ref: 'Ref 009150', monto: 'Bs 2.100,00', kanji: '未着', msg: '未着', detalle: 'この入金はまだ銀行に届いていません' },
        },
      },
    },
  };
});
