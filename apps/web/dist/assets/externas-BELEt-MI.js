import{c,E as $}from"./event-date-utils-iISX9EZk.js";const g={draft:"Rascunho",active:"Ativa",paused:"Pausada",archived:"Arquivada"},f=a=>{var t,r,n;const o=((r=(t=a.pivot)==null?void 0:t.funcao)==null?void 0:r.trim())||((n=a.role)==null?void 0:n.trim());return o?`- ${a.name} (${o})`:`- ${a.name}`},w=a=>`- ${[a.nome,a.marca,a.modelo].filter(t=>!!t&&t.trim()!=="").join(" | ")}`,E=a=>{var n,i,s,m,d,p,u,_,h;const o=[],t=((n=a.collaborators)==null?void 0:n.map(f))||[],r=((i=a.equipment)==null?void 0:i.map(w))||[];if((s=a.briefing)!=null&&s.trim()&&o.push(`📝 Briefing
${a.briefing.trim()}`),o.push(`👥 Colaboradores
${t.length>0?t.join(`
`):"- Nenhum colaborador vinculado"}`,`🎒 Equipamentos
${r.length>0?r.join(`
`):"- Nenhum equipamento vinculado"}`),(m=a.contato_nome)!=null&&m.trim()||(d=a.contato_whatsapp)!=null&&d.trim()){const e=[(p=a.contato_nome)!=null&&p.trim()?`- Nome: ${a.contato_nome.trim()}`:null,(u=a.contato_whatsapp)!=null&&u.trim()?`- WhatsApp: ${a.contato_whatsapp.trim()}`:null].filter(l=>l!==null);o.push(`📞 Contato do cliente
${e.join(`
`)}`)}if((_=a.observacao_interna)!=null&&_.trim()&&o.push(`📌 Observacoes internas
${a.observacao_interna.trim()}`),a.is_vip_gallery){const e=[`- Status: ${g[a.vip_gallery_status||"draft"]}`,(h=a.gallery_slug)!=null&&h.trim()?`- Galeria: https://www.coberturavip.com.br/${a.gallery_slug.trim()}`:null,a.allow_delete_command?`- Delete command: ${a.delete_command_keyword||"Ativo"}`:null,a.allow_pause_command?`- Pause command: ${a.pause_command_keyword||"Ativo"}`:null].filter(l=>l!==null);o.push(`📸 Cobertura VIP
${e.join(`
`)}`)}return o.join(`

`)},A=a=>{var i,s;const o=c(a.data_hora),t=a.data_hora_fim?c(a.data_hora_fim):c(new Date(new Date(a.data_hora).getTime()+2*60*60*1e3)),r=(((s=(i=a.category)==null?void 0:i.name)==null?void 0:s.trim())||"Evento").toUpperCase();return`https://calendar.google.com/calendar/render?${new URLSearchParams({action:"TEMPLATE",text:`${r} | ${a.titulo}`,dates:`${o}/${t}`,ctz:$,details:E(a),location:a.endereco_completo||a.local}).toString()}`},C=(a,o,t)=>{const r=o.replace(/\D/g,""),n=r.startsWith("55")?r:`55${r}`,i=t?`&text=${encodeURIComponent(t)}`:"";return`https://wa.me/${n}${i}`};export{C as a,A as g};
