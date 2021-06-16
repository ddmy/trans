const process = require('process')
const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')
const { JSDOM } = require('jsdom')
const iconv = require('iconv-lite')

const basePath = process.cwd()

async function transMain () {
  console.log('开始处理...')
  console.log('删除dist目录>>>')
  await fsPromises.rmdir(path.join(basePath, './dist'), { recursive: true }).catch(err => {
    throw new Error(err)
  })
  console.log('获取写入内容>>>')
  const result = await Promise.all([
    readFile(path.join(basePath, './index.html')),
    readFile(path.join(basePath, './index.css')),
    readFile(path.join(basePath, './index.js'))
  ]).catch(err => {
    console.log('读取文件失败!')
    throw new Error(err)
  })
  const [ html, css, js ] = result
  console.log('插入>>>')
  insert({ html, css, js })
}

async function readFile (url) {
  return new Promise((resolve, reject) => {
    fs.readFile(url, 'utf-8', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

async function insert ({ html, css, js }) {
  const { window } = new JSDOM(html)
  const { document } = window
  const head = document.querySelector('head')
  if (!head) throw new Error('html 缺少head')
  const meta = document.querySelectorAll('meta')
  ;[...meta].find(item => {
    if (item.outerHTML.includes('charset')) {
      item.outerHTML = '<meta charset="GBK">'
      console.log('---', item)
      return true
    }
  })
  const style = document.createElement('style')
  const script = document.createElement('script')
  style.className="transCss"
  script.className="transCss"
  style.innerHTML = css
  script.innerHTML = js
  head.appendChild(style)
  document.querySelector('html').appendChild(script)
  console.log('创建dist目录>>>')
  await fsPromises.mkdir(path.join(basePath, './dist')).catch(err => {
    throw new Error(err)
  })
  console.log('删除占位标签>>>')
  const removeTag = document.querySelectorAll('.trans-tag')
  Array.from(removeTag).forEach(item => {
    item.remove()
  })
  console.log('写入>>>>')
  const str = document.querySelector('html').innerHTML
  await writeFile(path.join(basePath, './dist/index.html'), '<!DOCTYPE html>' + str).catch(err => {
    throw new Error(err)
  })
}

function writeFile (url, inner) {
  return new Promise((resolve, reject) => {
    fs.writeFile(url, iconv.encode(inner, 'gbk'),(err) => {
      if (err) reject(err)
      resolve(true)
    })
  })
}
module.exports = transMain
