import{S as o,j as c,__tla as l}from"./index-f48ba628.js";let r,a=Promise.all([(()=>{try{return l}catch{}})()]).then(async()=>{const e=o.create({counter:0});o.observe(e,(t,n)=>{t==="counter"&&console.log("new counter value = ",n)}),r=()=>{const{counter:t}=o.use(e);return c.jsxs("h1",{onClick:()=>e.counter++,children:["Counter: ",t," (Click me!)"]})}});export{a as __tla,r as default};
