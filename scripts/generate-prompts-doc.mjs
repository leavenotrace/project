import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx'
import { writeFileSync } from 'node:fs'

// 米色/森林绿配色（与项目主题一致）
const GREEN = '2F5233'
const GOLD = 'B8860B'
const GRAY = '5A5A5A'

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: GREEN, size: 32 })],
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, bold: true, color: GREEN, size: 26 })],
  })
}

function note(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, italics: true, color: GRAY, size: 21 })],
  })
}

// 用户提示词：带左侧绿色边框的引用块
function prompt(text) {
  return new Paragraph({
    spacing: { after: 60 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 12 },
    },
    children: [new TextRun({ text, size: 23, color: '222222' })],
  })
}

function body(text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22 })],
  })
}

function spacer() {
  return new Paragraph({ spacing: { after: 60 }, children: [] })
}

const steps = [
  {
    title: '一、项目立项 —— 一句话需求',
    note: '最初用一段话把整个项目的目标、约束、数据结构一次讲清楚。这是最关键的一步：把"是什么、给谁用、什么环境、有哪些数据"说明白，AI 才能给出合适的技术方案。',
    prompts: [
      '在安卓系统的平板上做一个 app，用于毕业典礼的现场效果，每签一个名，生成一张带有该签名的树叶，飞到一棵树上。共有 100 名学生，现场提供 20 台平板供大家签名。',
      '20 台平板同时使用，得处理好数据同步的问题。现场是局域网。学生的信息事先存在数据库，包含姓名、学院、学号、性别、已签字段。现场每来一个学生，在软件界面直接搜索后四位学号，点击签名。后台数据库已签字段记录次数。实时生成带签名的树叶飞到一颗树上。',
    ],
  },
  {
    title: '二、确认技术方案（回答 AI 的提问）',
    note: 'AI 针对网络环境、展示方式、签名方式、数据状态提了几个关键问题。这些选择直接决定架构：有稳定外网 → 走云端部署（Vercel + Neon 数据库）；中央大屏展示；触屏手写签名；先用示例数据跑通。',
    prompts: [
      '网络环境：有稳定外网',
      '展示方式：中央大屏幕展示树和飞舞的树叶',
      '签名方式：触屏手写签名',
      '学生数据：先用示例数据',
    ],
  },
  {
    title: '三、跑通基础流程后的追问',
    note: '基础版本完成后，逐步明确使用细节。',
    prompts: [
      '签名后，大屏展示页面如何打开？',
      '（确认在平板首页增加一个不显眼的"打开大屏"入口）好啊',
    ],
  },
  {
    title: '四、完善示例数据',
    note: '发现模拟数据有重名，要求生成不重复的姓名，保证演示更真实。',
    prompts: ['模拟数据有同学的名字重复了，请生成不重复的名字'],
  },
  {
    title: '五、导入真实学生名单 + 加字段',
    note: '从演示数据切换到真实数据，同时给数据库增加"在校时间"字段。附件提供了 120 名真实毕业生记录。',
    prompts: [
      '在数据库里加上"在校时间"字段，删除之前的模拟数据，换上附件真实的学生记录',
    ],
  },
  {
    title: '六、增加管理后台',
    note: '为方便现场人员操作，增加了一套口令保护的管理后台：改树名、换背景图、增删改学生。',
    prompts: [
      '增加一个管理功能吧，比如：更换智慧树背景图、增删改学生信息数据，智慧树名称。智慧树名称暂时是"卓越工程师成长之树"',
      '管理页面加一个简单口令保护；更换背景图用上传图片文件的方式',
    ],
  },
  {
    title: '七、丰富树叶展示内容',
    note: '让每一片飞到树上的树叶卡片信息更完整。',
    prompts: ['在树上显示的包括：姓名、性别、院系、签名图片'],
  },
  {
    title: '八、优化树叶落点算法',
    note: '担心 120 片树叶在树冠上互相重叠，要求优化分布算法，让树叶均匀铺满整个树冠、自然错落。',
    prompts: [
      '最后是在大屏展示，估计还好',
      '优化一下落点算法也好',
    ],
  },
  {
    title: '九、增加清空签名功能',
    note: '方便反复测试和典礼正式开始前重置数据。',
    prompts: [
      '在管理页面增加一个清空签名记录的功能吧，方便测试使用。还有管理页面的管理口令是多少？',
    ],
  },
  {
    title: '十、反复打磨签名笔迹粗细',
    note: '为了让签名挂到大屏上更显眼，对手写笔迹的粗细进行了多轮微调，直到满意为止。这体现了"小步迭代、即时预览"的协作方式。',
    prompts: [
      '签名时字的线条太细，多加粗线，挂到树上更显眼些',
      '还可以更粗些',
      '还可以更粗些',
      '还可以更粗些',
      '感觉太粗了，要变细些',
      '还要变细些',
    ],
  },
  {
    title: '十一、大屏细节调整',
    note: '现场试用后的两个体验优化：隐藏可能尴尬的人数统计；把标题换成定制的书法字。',
    prompts: [
      '签名树右上角的这 3 个数字不用显示了，可能有些人不来，免得看着尴尬',
      '大屏上"卓越工程师成长之树"这几个字用附件书法图片代替',
    ],
  },
  {
    title: '十二、修复线上问题',
    note: '现场轮询时偶发数据库连接报错，要求修复运行时错误，保证大屏稳定运行。',
    prompts: ['预览出现运行时错误（数据库空闲连接被关闭导致轮询偶发失败），修复代码解决它'],
  },
]

const children = []

// 封面标题
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({ text: '卓越工程师成长之树', bold: true, color: GREEN, size: 44 }),
    ],
  }),
)
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: '毕业典礼现场签名互动大屏 —— 项目构建提示词记录',
        color: GRAY,
        size: 24,
      }),
    ],
  }),
)
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: '本文档按时间顺序整理了与 AI 协作构建本项目的全部需求提示词，供学习参考。',
        italics: true,
        color: GRAY,
        size: 20,
      }),
    ],
  }),
)

// 项目简介
children.push(h1('项目简介'))
children.push(
  body(
    '这是一个用于毕业典礼现场的互动应用。现场提供约 20 台平板供毕业生搜索本人学号、手写签名；每完成一次签名，就会实时生成一片带签名的树叶，飞到中央大屏的"成长之树"上，并显示该生的姓名、性别、院系和签名笔迹。配套有口令保护的管理后台，可修改树名、更换背景图、增删改学生名单、一键清空签名。',
  ),
)
children.push(
  body(
    '技术栈：Next.js（App Router）+ Neon Postgres 数据库 + Drizzle ORM + Vercel Blob 图片存储，云端部署。多台平板共用一个云数据库，天然实现实时数据同步；大屏通过定时轮询接口获取最新签名并播放飞入动画。',
  ),
)
children.push(spacer())

// 协作方法小结
children.push(h1('协作方法小结（重点）'))
children.push(
  body(
    '从下面的提示词可以看出几个高效协作的习惯：1）开头用一段话把目标、用户、现场环境、数据结构一次讲清；2）先跑通核心流程，再逐步加功能（管理后台、清空、书法标题等）；3）每次只提一个明确的小需求，看效果后再微调（比如笔迹粗细调了好几轮）；4）发现问题直接描述现象，让 AI 定位并修复。',
  ),
)
children.push(spacer())

// 提示词正文
children.push(h1('完整提示词记录（按时间顺序）'))
for (const step of steps) {
  children.push(h2(step.title))
  if (step.note) children.push(note(step.note))
  for (const p of step.prompts) {
    children.push(prompt('“' + p + '”'))
  }
  children.push(spacer())
}

const doc = new Document({
  creator: '卓越工程师成长之树项目',
  title: '项目构建提示词记录',
  styles: {
    default: {
      document: {
        run: { font: '微软雅黑' },
      },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1133, bottom: 1133, left: 1133, right: 1133 } },
      },
      children,
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
writeFileSync('public/卓越工程师成长之树-项目提示词记录.docx', buffer)
console.log('[v0] Word 文档已生成：public/卓越工程师成长之树-项目提示词记录.docx')
