import{c as x,r as l,j as e,U as b,V as U,B as N,Y as P,Z as n,x as q,_ as w,F as A,$ as D,E,z as s}from"./index-Bp58vWmt.js";import{D as B,a as O,b as R,c as S}from"./dialog-BPwthQpy.js";import{S as $}from"./sparkles-BCI_WZ_i.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=x("Brain",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=x("ClipboardCopy",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",key:"4jdomd"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v4",key:"3hqy98"}],["path",{d:"M21 14H11",key:"1bme5i"}],["path",{d:"m15 10-4 4 4 4",key:"5dvupr"}]]);function I(){const r="https://adm.tvvip.social".trim();if(r)return r;const a="https://adm.tvvip.social/api/v1".trim();return a&&!a.startsWith("/")?new URL(a).origin:window.location.origin}function c(r,a="raw"){const o=I(),d=o.endsWith("/")?o:`${o}/`,i=new URL(`news/${r}.md`,d);return a==="enriched"&&i.searchParams.set("view","enriched"),i.toString()}function m(r){return`Reescreva a notícia abaixo em português do Brasil, com estilo jornalístico profissional, claro e original.

Use como base o conteúdo deste arquivo:
${r}

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
5. 3 chamadas curtas para redes`}function z(r){const a=m(c(r));return`https://chatgpt.com/?q=${encodeURIComponent(a)}`}function F(r){const a=m(c(r));return`https://claude.ai/new?q=${encodeURIComponent(a)}`}async function u(r){const a=c(r),o=await fetch(a);if(!o.ok)throw new Error(`Erro ao buscar markdown: ${o.status}`);return o.text()}function p(r){window.open(r,"_blank","noopener,noreferrer")||s.warning("Popup bloqueado pelo navegador. Copie o prompt e cole manualmente.")}function Z({publicToken:r}){const[a,o]=l.useState(!1),[d,i]=l.useState(""),[f,h]=l.useState(!1);if(!r)return null;const y=()=>{p(z(r))},g=()=>{p(F(r))},v=async()=>{try{const t=c(r),M=m(t);await navigator.clipboard.writeText(M),s.success("Prompt copiado!")}catch{s.error("Nao foi possivel copiar o prompt")}},j=async()=>{try{const t=await u(r);await navigator.clipboard.writeText(t),s.success("Markdown copiado!")}catch{s.error("Erro ao buscar markdown")}},k=async()=>{h(!0),o(!0);try{const t=await u(r);i(t)}catch{i("Erro ao carregar o markdown."),s.error("Erro ao buscar markdown")}finally{h(!1)}},C=()=>{const t=c(r);p(t)};return e.jsxs(e.Fragment,{children:[e.jsxs(b,{children:[e.jsx(U,{asChild:!0,children:e.jsxs(N,{variant:"outline",size:"sm",className:"rounded-lg border-primary/30 text-primary hover:bg-primary/10",children:[e.jsx($,{className:"mr-1 h-3 w-3"}),"Gerar com I.A."]})}),e.jsxs(P,{align:"start",className:"w-52",children:[e.jsxs(n,{onClick:y,children:[e.jsx(q,{className:"mr-2 h-4 w-4"}),"Abrir no ChatGPT"]}),e.jsxs(n,{onClick:g,children:[e.jsx(L,{className:"mr-2 h-4 w-4"}),"Abrir no Claude"]}),e.jsx(w,{}),e.jsxs(n,{onClick:v,children:[e.jsx(G,{className:"mr-2 h-4 w-4"}),"Copiar Prompt"]}),e.jsxs(n,{onClick:j,children:[e.jsx(A,{className:"mr-2 h-4 w-4"}),"Copiar Markdown"]}),e.jsx(w,{}),e.jsxs(n,{onClick:k,children:[e.jsx(D,{className:"mr-2 h-4 w-4"}),"Ver Markdown"]}),e.jsxs(n,{onClick:C,children:[e.jsx(E,{className:"mr-2 h-4 w-4"}),"Abrir Markdown"]})]})]}),e.jsx(B,{open:a,onOpenChange:o,children:e.jsxs(O,{className:"max-h-[80vh] overflow-y-auto rounded-2xl sm:max-w-3xl",children:[e.jsx(R,{children:e.jsx(S,{children:"Preview Markdown"})}),f?e.jsx("div",{className:"flex items-center justify-center py-12 text-sm text-muted-foreground",children:"Carregando..."}):e.jsx("pre",{className:"max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-muted/30 p-4 font-mono text-xs leading-relaxed",children:d})]})})]})}export{Z as A,L as B};
