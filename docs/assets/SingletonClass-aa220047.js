var b=Object.defineProperty;var p=(r,e,n)=>e in r?b(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var u=(r,e,n)=>(p(r,typeof e!="symbol"?e+"":e,n),n);import{S as j,j as t,__tla as g}from"./index-2a62623b.js";let x,f=Promise.all([(()=>{try{return g}catch{}})()]).then(async()=>{var r=Object.defineProperty,e=Object.getOwnPropertyDescriptor,n=(o,s,i,a)=>{for(var c=a>1?void 0:a?e(s,i):s,h=o.length-1,d;h>=0;h--)(d=o[h])&&(c=(a?d(s,i,c):d(c))||c);return a&&c&&r(s,i,c),c};let l=class{constructor(){u(this,"counter_",0);u(this,"dec",()=>this.counter_--);u(this,"inc",()=>this.counter_++)}get counter(){return this.counter_}};l=n([j.global],l);let _;_=()=>{const{counter:o}=j.use(l);return t.jsxs("h1",{children:["count: ",o]})},x=()=>{const{counter:o,dec:s,inc:i}=j.use(l);return t.jsxs(t.Fragment,{children:[t.jsx("button",{onClick:s,children:"dec"}),t.jsx("div",{children:o}),t.jsx("button",{onClick:i,children:"inc"}),t.jsx("br",{}),t.jsx(_,{})]})}});export{f as __tla,x as default};
