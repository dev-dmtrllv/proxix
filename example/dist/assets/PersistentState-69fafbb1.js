import{S as e,j as r,__tla as c}from"./index-2a62623b.js";let n,l=Promise.all([(()=>{try{return c}catch{}})()]).then(async()=>{let t;t=e.createPersistent("persistent-counter",{counter:0}),n=()=>{const s=e.use(t);return r.jsxs("div",{children:[r.jsx("h1",{onClick:()=>s.counter++,children:s.counter}),r.jsx("button",{onClick:()=>e.reset(t),children:"Reset"})]})}});export{l as __tla,n as default};