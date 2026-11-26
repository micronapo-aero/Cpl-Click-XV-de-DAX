import{m as g,_ as y,n as I,p as C,F as A,r as b,C as O,t as E,g as D}from"./client-BQTH-8nO.js";import{A as _,e as S}from"./index-BY4TGy7o.js";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const P="type.googleapis.com/google.protobuf.Int64Value",L="type.googleapis.com/google.protobuf.UInt64Value";function v(e,t){const n={};for(const i in e)e.hasOwnProperty(i)&&(n[i]=t(e[i]));return n}function p(e){if(e==null)return null;if(e instanceof Number&&(e=e.valueOf()),typeof e=="number"&&isFinite(e)||e===!0||e===!1||Object.prototype.toString.call(e)==="[object String]")return e;if(e instanceof Date)return e.toISOString();if(Array.isArray(e))return e.map(t=>p(t));if(typeof e=="function"||typeof e=="object")return v(e,t=>p(t));throw new Error("Data cannot be encoded in JSON: "+e)}function f(e){if(e==null)return e;if(e["@type"])switch(e["@type"]){case P:case L:{const t=Number(e.value);if(isNaN(t))throw new Error("Data cannot be decoded from JSON: "+e);return t}default:throw new Error("Data cannot be decoded from JSON: "+e)}return Array.isArray(e)?e.map(t=>f(t)):typeof e=="function"||typeof e=="object"?v(e,t=>f(t)):e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const m="functions";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const N={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class u extends A{constructor(t,n,i){super(`${m}/${t}`,n||""),this.details=i}}function R(e){if(e>=200&&e<300)return"ok";switch(e){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function F(e,t){let n=R(e),i=n,r;try{const o=t&&t.error;if(o){const s=o.status;if(typeof s=="string"){if(!N[s])return new u("internal","internal");n=N[s],i=s}const a=o.message;typeof a=="string"&&(i=a),r=o.details,r!==void 0&&(r=f(r))}}catch{}return n==="ok"?null:new u(n,i,r)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U{constructor(t,n,i){this.auth=null,this.messaging=null,this.appCheck=null,this.auth=t.getImmediate({optional:!0}),this.messaging=n.getImmediate({optional:!0}),this.auth||t.get().then(r=>this.auth=r,()=>{}),this.messaging||n.get().then(r=>this.messaging=r,()=>{}),this.appCheck||i.get().then(r=>this.appCheck=r,()=>{})}async getAuthToken(){if(this.auth)try{const t=await this.auth.getToken();return t==null?void 0:t.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(t){if(this.appCheck){const n=t?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return n.error?null:n.token}return null}async getContext(t){const n=await this.getAuthToken(),i=await this.getMessagingToken(),r=await this.getAppCheckToken(t);return{authToken:n,messagingToken:i,appCheckToken:r}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const h="us-central1";function x(e){let t=null;return{promise:new Promise((n,i)=>{t=setTimeout(()=>{i(new u("deadline-exceeded","deadline-exceeded"))},e)}),cancel:()=>{t&&clearTimeout(t)}}}class ${constructor(t,n,i,r,o=h,s){this.app=t,this.fetchImpl=s,this.emulatorOrigin=null,this.contextProvider=new U(n,i,r),this.cancelAllRequests=new Promise(a=>{this.deleteService=()=>Promise.resolve(a())});try{const a=new URL(o);this.customDomain=a.origin+(a.pathname==="/"?"":a.pathname),this.region=h}catch{this.customDomain=null,this.region=o}}_delete(){return this.deleteService()}_url(t){const n=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${n}/${this.region}/${t}`:this.customDomain!==null?`${this.customDomain}/${t}`:`https://${this.region}-${n}.cloudfunctions.net/${t}`}}function M(e,t,n){e.emulatorOrigin=`http://${t}:${n}`}function G(e,t,n){return i=>H(e,t,i,{})}async function V(e,t,n,i){n["Content-Type"]="application/json";let r;try{r=await i(e,{method:"POST",body:JSON.stringify(t),headers:n})}catch{return{status:0,json:null}}let o=null;try{o=await r.json()}catch{}return{status:r.status,json:o}}function H(e,t,n,i){const r=e._url(t);return J(e,r,n,i)}async function J(e,t,n,i){n=p(n);const r={data:n},o={},s=await e.contextProvider.getContext(i.limitedUseAppCheckTokens);s.authToken&&(o.Authorization="Bearer "+s.authToken),s.messagingToken&&(o["Firebase-Instance-ID-Token"]=s.messagingToken),s.appCheckToken!==null&&(o["X-Firebase-AppCheck"]=s.appCheckToken);const a=i.timeout||7e4,l=x(a),c=await Promise.race([V(t,r,o,e.fetchImpl),l.promise,e.cancelAllRequests]);if(l.cancel(),!c)throw new u("cancelled","Firebase Functions instance was deleted.");const T=F(c.status,c.json);if(T)throw T;if(!c.json)throw new u("internal","Response is not valid JSON object.");let d=c.json.data;if(typeof d>"u"&&(d=c.json.result),typeof d>"u")throw new u("internal","Response is missing data field.");return{data:f(d)}}const k="@firebase/functions",w="0.11.8";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const q="auth-internal",z="app-check-internal",B="messaging-internal";function X(e,t){const n=(i,{instanceIdentifier:r})=>{const o=i.getProvider("app").getImmediate(),s=i.getProvider(q),a=i.getProvider(B),l=i.getProvider(z);return new $(o,s,a,l,r,e)};b(new O(m,n,"PUBLIC").setMultipleInstances(!0)),E(k,w,t),E(k,w,"esm2017")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Y(e=C(),t=h){const i=y(g(e),m).getImmediate({identifier:t}),r=I("functions");return r&&j(i,...r),i}function j(e,t,n){M(g(e),t,n)}function K(e,t,n){return G(g(e),t)}X(fetch.bind(self));const W="us-central1",Q=S({fr:{invalid:"Code d’invitation invalide.",disabled:"Ce code d’invitation n’est plus actif.",full:"L’application est complète : aucune place n’est disponible pour le moment.",attempts:"Trop d’essais. Réessayez dans une heure.",revoked:"Cet accès a été retiré.",google:"Connectez-vous d’abord avec Google.",failed:"Vérification impossible pour le moment. Réessayez.",offline:"Connexion Internet nécessaire."},en:{invalid:"Invalid invitation code.",disabled:"This invitation code is no longer active.",full:"The app is full: no place is available right now.",attempts:"Too many attempts. Try again in an hour.",revoked:"This access has been withdrawn.",google:"Sign in with Google first.",failed:"Verification is not possible right now. Try again.",offline:"An Internet connection is required."}});function Z(e){const t=Q();if(!navigator.onLine)return t.offline;if(!(e instanceof A))return t.failed;switch(e.message){case"invalid-code":return t.invalid;case"code-disabled":return t.disabled;case"full":return t.full;case"too-many-attempts":return t.attempts;case"revoked":return t.revoked;case"google-required":case"sign-in-required":return t.google;default:return t.failed}}async function ie(e){var i;const{app:t,auth:n}=D();try{await K(Y(t,W),"redeemInvite")({code:e}),await((i=n.currentUser)==null?void 0:i.getIdToken(!0))}catch(r){throw new _(Z(r))}}export{ie as redeemInvite};
