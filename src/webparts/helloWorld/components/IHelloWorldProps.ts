import { WebPartContext } from "@microsoft/sp-webpart-base";  
import { SPHttpClient } from '@microsoft/sp-http';
export interface IHelloWorldProps {
  title: string;
  links: { text: string; url: string; date: string }[];
  onLinkClick: (text: string) => void;
  downloadFile: (text: string) => void;
  selectedIcon: string; 
  iconPicker:string;
  iconset:string;  
  listName:string;
  selectedList: string;
  selectedView:string;
  description: string;  
  context: WebPartContext;  
  list: string,  
  fields: string[]  
  libraryItems: any[]; 
  spHttpClient: SPHttpClient;
  webUrl: string;
  document:[]
}
