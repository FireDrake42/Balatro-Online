/* Pure presentation: escape raw text, then add only fixed semantic spans. */
(function(root,factory){'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory();else root.BOEffectText=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // One pass over already-escaped text: literal source tags are inert and never
 // scanned as attributes; our newly generated spans are never scanned again.
 const number='(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)(?:e[+-]?\\d+|Qa|Qi|[KMBT])?';
 const token=new RegExp('&lt;[\\s\\S]*?&gt;|\\+(?:\\s*'+number+'\\s*|\\s*)(?:Mult|Chips)\\b|\\b(?:\\d+(?:\\.\\d+)?[ \\t]+in[ \\t]+\\d+(?:\\.\\d+)?(?:[ \\t]+chance)?|probabilit(?:y|ies))\\b','gi');
 function html(value){return escape(value).replace(token,(text,offset,source)=>{
  if(text.startsWith('&lt;'))return text;
  if(text[0]==='+'){
   if(offset&&/[\w.+×−-]/.test(source[offset-1]))return text;
   return '<span class="effect-text-'+(/Mult$/i.test(text)?'mult':'chips')+'">'+text+'</span>';
  }
  return '<span class="effect-text-probability probability-highlight">'+text+'</span>';
 })}
 return {html};
});
