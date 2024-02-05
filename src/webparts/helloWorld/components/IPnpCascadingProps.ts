import { WebPartContext } from "@microsoft/sp-webpart-base";  
  
export interface IPnpCascadingProps {  
  description: string;  
  context: WebPartContext;  
  list: string,  
  fields: string[]  
}  