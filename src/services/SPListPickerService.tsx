import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { sp } from '@pnp/sp';


export class SPService {
  private spHttpClient: SPHttpClient;
  private webUrl: string;
  serverRelativeUrl:string
  constructor(private context: WebPartContext) {
    this.spHttpClient = this.context.spHttpClient;
    this.webUrl = this.context.pageContext.web.absoluteUrl;
    this.serverRelativeUrl = this.context.pageContext.web.serverRelativeUrl;

    // Assuming you want to use PnP JS library
    sp.setup({
      spfxContext: this.context,
    });
  }
  public async getFields(selectedList: string): Promise<any> {
    try {
      const allFields: any[] = await sp.web.lists
        .getById(selectedList).
        fields.
        filter("Hidden eq false and ReadOnlyField eq false").get();;
      return allFields;
    }
    catch (err) {
      Promise.reject(err);
    }
  }

  public async getViews(selectedList: string): Promise<any[]> {
    try {
      const allViews: any[] = await sp.web.lists.getById(selectedList)
        .views.select('Title')
        .get();
      return allViews;
    } catch (err) {
      console.error('Error fetching views:', err);
      throw err;
    }
  }


 /*private getFileContent = (url: string): Promise<any> => {
    return this.context.spHttpClient.get(url, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        if (!response.ok) {
          throw new Error(`Error getting file content. Status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .catch((error: any) => {
        throw error;
      });
  };*/


  public async downloadFile(documentLibName: string, fileName: string): Promise<void> {
    const endpoint = `${this.webUrl}/_api/web/GetFileByServerRelativeUrl('${this.serverRelativeUrl}/${documentLibName}/${fileName}')/$value`;

    try {
      const response: SPHttpClientResponse = await this.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
      const data: ArrayBuffer = await response.arrayBuffer();

      const fileBlob = new Blob([data]);
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(fileBlob);
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  //get listitems by camelqueryview
 
  // First method that retrieves the View Query
  public static getViewQueryForList(listid: string, viewId: string): Promise<string> {
    
    if (listid && viewId) {
        // Add "FileLeafRef" to include the file name in the query
        return sp.web.lists.getById(listid).views.getById(viewId).select("ViewQuery").expand().get().then(v => {
            return v.ViewQuery;
        });
    } else {
        console.log('getViewQueryForList Error!');
        return Promise.reject('getViewQueryForList Error!'); // Return a rejected Promise with an error message
    }
  }
  

  public static getItemsByViewQuery(listid: string,query:Text): Promise<Array<any>> {
    const xml = '<View><Query><Where><Eq><FieldRef Name="ID" /><Value Type="Counter">16</Value></Eq></Where></Query></View>';
    return sp.web.lists.getById(listid).select('*').getItemsByCAMLQuery({ 'ViewXml': xml }).then((items: any[]) => {
        // Modify this part to extract file and name values
        const result = items.map(item => {
            return {
                id: item.Id,
                title: item.Title,
                file: item.File ? {
                    name: item.File.Name,
                    // Add other file properties as needed
                } : null,
                // Add other properties as needed
            };
        });
        return result;
    });
}


public static getItemsByViewQuery2(listid: string, query:Text): Promise<any> {
  const viewXml = '<View><Query><Where><Eq><FieldRef Name="ID" /><Value Type="Counter">16</Value></Eq></Where></Query></View>';
  return sp.web.lists.getById(listid).items.select('*').filter(viewXml).get().then((items: any[]) => {
      const result = items.map(item => {
          return {
              id: item.Id,
              title: item.Title,
              file: item.File ? {
                  name: item.File.Name,
                  // Add other file properties as needed
              } : null,
              // Add other properties as needed
          };
      });
      return result;
  });
}


getDocuments = (selectedlist:string): Promise<any> => {
  return this.context.spHttpClient.get(
    `${this.context.pageContext.web.absoluteUrl}/_api/web/Lists/GetById('${selectedlist}')/items?$select=Title,Modified,UniqueId,File/Name,File/Size,File/Length&$expand=File`,
    SPHttpClient.configurations.v1
  )
    .then((response: SPHttpClientResponse) => {
      if (!response.ok) {
        return response.json()
          .then((json: any) => { throw Error(json.error ? json.error.message : response.status.toString()); });
      }
      return response.json();
    })
    .then((json: any) => {
      const returnValue = json.value || json;
      return returnValue;
    })
    .catch((error: any) => {
      throw error;
    });
}





}

