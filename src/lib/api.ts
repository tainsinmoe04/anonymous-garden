export class ApiError extends Error{constructor(public code:string,public status:number){super(code);}}
export async function gardenApi<T>(path:string,options:{method?:'POST'|'PATCH'|'DELETE';body?:unknown}={}):Promise<T>{
 const response=await fetch(`/api/garden/${path}`,{method:options.method??'GET',credentials:'same-origin',cache:'no-store',headers:options.body===undefined?{}:{'Content-Type':'application/json'},body:options.body===undefined?undefined:JSON.stringify(options.body)});
 const data=await response.json();if(!response.ok)throw new ApiError(data.error??'service_unavailable',response.status);return data as T;
}
