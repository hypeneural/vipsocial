import{c as x,r as d,j as e,U as b,V as N,B as P,Y as U,Z as n,x as A,_ as w,F as q,$ as D,E,z as s}from"./index-By-G8CKS.js";import{D as $,a as B,b as O,c as S}from"./dialog-CFvRG0Hi.js";import{S as R}from"./sparkles-DfYSte4r.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=x("Brain",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=x("ClipboardCopy",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",key:"4jdomd"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v4",key:"3hqy98"}],["path",{d:"M21 14H11",key:"1bme5i"}],["path",{d:"m15 10-4 4 4 4",key:"5dvupr"}]]);function L(){const a="https://adm.tvvip.social/api/v1";if(a.startsWith("/")){const r=a;return`${window.location.origin}${r}`}return a}function i(a,r="raw"){const o=L(),c=new URL(`${o}/public/news/${a}/markdown`);return r==="enriched"&&c.searchParams.set("view","enriched"),c.toString()}function p(a){return`Reescreva a notícia abaixo em português do Brasil, com estilo jornalístico profissional, claro e original.

Use como base o conteúdo deste arquivo:
${a}

Objetivo:
- criar uma versão original
- manter fidelidade factual
- preservar nomes, datas, locais, cargos e números
- evitar copiar frases literalmente
- evitar sensacionalismo
- manter tom informativo

Retorne em:
1. Título
2. Subtítulo
3. Lead
4. Corpo da matéria
5. 3 chamadas curtas para redes`}function z(a){const r=p(i(a));return`https://chatgpt.com/?q=${encodeURIComponent(r)}`}function F(a){const r=p(i(a));return`https://claude.ai/new?q=${encodeURIComponent(r)}`}async function u(a){const r=i(a),o=await fetch(r);if(!o.ok)throw new Error(`Erro ao buscar markdown: ${o.status}`);return o.text()}function l(a){window.open(a,"_blank","noopener,noreferrer")||s.warning("Popup bloqueado pelo navegador. Copie o prompt e cole manualmente.")}function W({publicToken:a}){const[r,o]=d.useState(!1),[c,m]=d.useState(""),[f,h]=d.useState(!1);if(!a)return null;const y=()=>{l(z(a))},g=()=>{l(F(a))},v=async()=>{try{const t=i(a),M=p(t);await navigator.clipboard.writeText(M),s.success("Prompt copiado!")}catch{s.error("Nao foi possivel copiar o prompt")}},j=async()=>{try{const t=await u(a);await navigator.clipboard.writeText(t),s.success("Markdown copiado!")}catch{s.error("Erro ao buscar markdown")}},k=async()=>{h(!0),o(!0);try{const t=await u(a);m(t)}catch{m("Erro ao carregar o markdown."),s.error("Erro ao buscar markdown")}finally{h(!1)}},C=()=>{const t=i(a);l(t)};return e.jsxs(e.Fragment,{children:[e.jsxs(b,{children:[e.jsx(N,{asChild:!0,children:e.jsxs(P,{variant:"outline",size:"sm",className:"rounded-lg border-primary/30 text-primary hover:bg-primary/10",children:[e.jsx(R,{className:"mr-1 h-3 w-3"}),"Gerar com I.A."]})}),e.jsxs(U,{align:"start",className:"w-52",children:[e.jsxs(n,{onClick:y,children:[e.jsx(A,{className:"mr-2 h-4 w-4"}),"Abrir no ChatGPT"]}),e.jsxs(n,{onClick:g,children:[e.jsx(G,{className:"mr-2 h-4 w-4"}),"Abrir no Claude"]}),e.jsx(w,{}),e.jsxs(n,{onClick:v,children:[e.jsx(I,{className:"mr-2 h-4 w-4"}),"Copiar Prompt"]}),e.jsxs(n,{onClick:j,children:[e.jsx(q,{className:"mr-2 h-4 w-4"}),"Copiar Markdown"]}),e.jsx(w,{}),e.jsxs(n,{onClick:k,children:[e.jsx(D,{className:"mr-2 h-4 w-4"}),"Ver Markdown"]}),e.jsxs(n,{onClick:C,children:[e.jsx(E,{className:"mr-2 h-4 w-4"}),"Abrir Markdown"]})]})]}),e.jsx($,{open:r,onOpenChange:o,children:e.jsxs(B,{className:"max-h-[80vh] overflow-y-auto rounded-2xl sm:max-w-3xl",children:[e.jsx(O,{children:e.jsx(S,{children:"Preview Markdown"})}),f?e.jsx("div",{className:"flex items-center justify-center py-12 text-sm text-muted-foreground",children:"Carregando..."}):e.jsx("pre",{className:"max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-muted/30 p-4 font-mono text-xs leading-relaxed",children:c})]})})]})}export{W as A,G as B};
