// netlify/functions/chat.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  let keyword = '', step = '_start', answer = '', context = {};
  try {
    const body = JSON.parse(event.body || '{}');
    keyword = String(body.keyword || '').trim();
    step    = String(body.step    || '_start').trim();
    answer  = String(body.answer  || '').trim();
    context = body.context && typeof body.context === 'object' ? body.context : {};
  } catch(_) {}

  const flows = getFlows();
  const flow = flows[keyword];
  if (!flow) return json({ ok:false, error:'not_found' }, 404);

  const node = flow.map[step] || flow.map['_start'];
  if (!answer) return json(reply(node.prompt, node.role, step, { next: step }));

  const ok = node.expect ? new RegExp(node.expect).test(answer) : true;
  if (!ok) {
    return json(reply(node.retry || '違うようですね。もう一度考えてみましょう。', node.role, step, {
      next: step, retry: true, context
    }));
  }

  if (node.capture) context[node.capture] = answer;

  const nextKey = node.next || 'end';
  const next = flow.map[nextKey];

  let promptText = next ? next.prompt : '完了しました。';
  if (nextKey === 'summary') {
    const p1 = context.page  || '―';
    const p2 = context.evidencePages || answer;
    promptText =
      `なるほど。つまりまとめると『参加者数が減っているのに全員参加と記されている。` +
      `根拠は p.${p1} と p.${p2}』という回答ですね。これで奇録会に送信してみますか？（送信 と入力）`;
  }

  return json({
    ok:true, role: next?.role || 'hello', prompt: promptText, next: nextKey, context
  });
};

function reply(prompt, role='hello', next='_start', extra={}) {
  return Object.assign({ ok:true, role, prompt, next }, extra);
}
function json(obj, code=200){
  return {
    statusCode: code,
    headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' },
    body: JSON.stringify(obj)
  };
}

/* ==== フロー定義 ==== */
function baseMap(){
  return {
    _start: {
      role:'hello',
      prompt:'それでは、回答をまとめましょう。祭事報告書の何ページの資料が根拠でしょうか？（全角数字のみで回答）',
      expect: '^\\d+$',
      capture: 'page',
      next: 'oddPoint'
    },
    oddPoint: {
      role:'hello',
      prompt:'この参加者名簿のどこがおかしい？（名前、人数、住所）',
      expect: '人数',
      next: 'trend',
      retry:'違うようですね。もう一度考えてみましょう。（名前、人数、住所）'
    },
    trend: {
      role:'hello',
      prompt:'参加者名簿の人数がどうなっている？（増えている、減っている、同じ）',
      expect: '減っている',
      next: 'evidence',
      retry:'もう一度。人数はどう推移していますか？（増えている、減っている、同じ）'
    },
    evidence: {
      role:'hello',
      prompt:'人数が減っているのは転居や欠席では？そうでない根拠のページ数を示してください（全角可・複数は「、」区切り 例：５，１３）',
      expect: '^\\d+(、\\d+)*$',
      capture: 'evidencePages',
      next: 'summary'
    },
    summary: {
      role:'hello',
      prompt:'(dynamic)',
      next: 'confirm'
    },
    confirm: {
      role:'hello',
      prompt:'送信してよければ「送信」と入力してください。',
      expect: '送信',
      next: 'end',
      retry:'キャンセルする場合は、そのまま別のキーワードを入力してください。送るなら「送信」。'
    },
    end: {
      role:'hello',
      prompt:'送信しました。奇録会からの返信をお待ちください。'
    }
  };
}

function getFlows(){
  return {
    '行方不明者の根拠':         { map: baseMap() },
    '行方不明者の特徴':         { map: baseMap() },   // Q2：フローは同じ
    '行方不明になった場所':     { map: baseMap() },   // Q3：フローは同じ
    '真相':                     { map: baseMap() }    // Q4：フローは同じ
  };
}
