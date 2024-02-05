import * as React from 'react';
import * as ReactDom from 'react-dom';
//import { sp } from "@pnp/sp";
import { PropertyFieldIconPicker } from '@pnp/spfx-property-controls/lib/PropertyFieldIconPicker';
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  IPropertyPaneDropdownOption,

  //PropertyPaneDropdown,
} from '@microsoft/sp-property-pane';
//import { IPnpCascadingProps } from './components/IPnpCascadingProps';  
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
//import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'; 
//import { sp } from '@pnp/sp';  
import { SPService } from '../../services/SPListPickerService';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
//import SPListPickerService from '../../services/SPListPickerService'
import HelloWorld from './components/HelloWorld';
import { IHelloWorldProps } from './components/IHelloWorldProps';

import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { PropertyFieldViewPicker, PropertyFieldViewPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldViewPicker';
import { WebPartContext } from "@microsoft/sp-webpart-base";  

export interface IHelloWorldWebPartProps {
  description: string;
  selectedIcon: string;
  listName: string;
  selectedList: string;
  selectedView: string;
  lists: string;
  fields: string[];
  list: string;
  view: string; // Stores the view ID
  libraryItems: any[];
  iconset: string;
  iconPicker: string
  context: WebPartContext;  
}
export interface IHelloWorldState { 
  Data:[]
}



// ... existing imports

export default class HelloWorldWebPart extends BaseClientSideWebPart<IHelloWorldWebPartProps> {
  private _siteLists: IPropertyPaneDropdownOption[];
  //rivate _siteViews: IPropertyPaneDropdownOption[];
  private _services: SPService;
 
 



  protected async onInit(): Promise<void> {
    this._siteLists = await this._getSiteLibraries();
    //this._siteViews = await this._getDefaultViews();
    this._services = new SPService(this.context);
    //this.getListFields = this.getListFields.bind(this); 
    return super.onInit();
  }


  private async _getSiteLibraries(): Promise<IPropertyPaneDropdownOption[]> {
    const endpoint: string = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists?$select=Title&$filter=Hidden eq false and BaseTemplate eq 101&$orderby=Title&$top=10`;
    const rawResponse: SPHttpClientResponse = await this.context.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

    return (await rawResponse.json()).value.map(
      (list: { Title: string }) => {
        return { key: list.Title, text: list.Title };
      }
    );
  }

  public async getListViews(): Promise<IPropertyPaneDropdownOption[]> {
    if (this.properties.selectedList) {
      try {
        let allViews = await this._services.getViews(this.properties.selectedList);
        return allViews.map(view => ({ key: view.Title, text: view.Title }));
      } catch (error) {
        console.error('Error fetching views:', error);
        throw error;
      }
    }
    return [];
  }

  private async getItemsForSelectedView(): Promise<void> {
    try {
      if (!this.properties.selectedList || !this.properties.selectedView) {
        console.error('Selected list or view is not available.');
        return;
      }

      const endpoint: string = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getByTitle('${this.properties.selectedList}')/views('${this.properties.selectedView}')/items?$select=Title,OtherFields`;
      const rawResponse: SPHttpClientResponse = await this.context.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);

      const items: any[] = (await rawResponse.json()).value;

      this.properties.libraryItems = items;
      this.render();
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }
  private async listConfigurationChanged(propertyPath: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyPath === 'lists' && newValue) {
      this.properties.fields = [];
      this.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    } else if (propertyPath === 'view' && newValue) {
      this.properties.fields = [];
      this.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
      this.getDocuments();
      // Trigger onPropertyPaneFieldChanged for selectedView      
    }

    this.context.propertyPane.refresh();
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
  }

  public async render(): Promise<void> {
    const element: React.ReactElement<IHelloWorldProps> = React.createElement(HelloWorld, {
      title: this.properties.description,
      listName: this.properties.listName,
      selectedIcon: this.properties.selectedIcon,
      selectedList: this.properties.selectedList,
      selectedView: this.properties.view,
      context: this.context,
      description: this.properties.description,
      list: this.properties.lists,
      fields: this.properties.fields,
      libraryItems: this.properties.libraryItems,
      iconset: this.properties.iconset,
      iconPicker: this.properties.iconPicker,
      
      links: [
        { text: 'Link 1', url: '#link1', date: '2022-01-30' },
        { text: 'Link 2', url: '#link2', date: '2022-02-01' },
        ...(this.properties.libraryItems || []).map(item => ({
          text: item.Title, // Update with your actual field name
          url: `#${item.Id}`, // Update with a unique identifier for each item
          date: item.Modified, // Update with your actual date field
        })),
      ],
      
      onLinkClick: this.handleLinkClick.bind(this),
    });

    ReactDom.render(element, this.domElement);
  }

  private handleLinkClick(text: string): void {
    alert(`Clicked on link: ${text}`);
  }

  public onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    {
      // Fetch items when either selectedList or selectedView changes
      if (propertyPath === 'view') {
        this.getItemsForSelectedView();
      }

    }

    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

  }

  getDocuments = (): Promise<any> => {
    return this.context.spHttpClient.get(
      `${this.context.pageContext.web.absoluteUrl}/_api/web/Lists/GetById('${this.properties.lists}')/items?$select=Title,Modified,UniqueId,File/Name,File/Size,File/Length&$expand=File`,
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

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Web Part Configuration' },
          groups: [
            {
              groupName: 'Basic Settings',
              groupFields: [
                PropertyPaneTextField('description', { label: 'Web Part Title' }),
                PropertyPaneDropdown('selectedList', {
                  label: 'Site lists',
                  options: this._siteLists.map((list: IPropertyPaneDropdownOption) => {
                    return { key: list.text, text: list.text };
                  }),
                }),                
                PropertyFieldListPicker('lists', {
                  label: 'Select a list',
                  selectedList: this.properties.lists,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  baseTemplate: [101, 100],
                  onPropertyChange: this.listConfigurationChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  //onGetErrorMessage: null,
                  key: 'listPickerFieldId',
                }),
                PropertyFieldViewPicker('view', {
                  label: 'Select a view',
                  listId: this.properties.lists,
                  selectedView: this.properties.view,
                  orderBy: PropertyFieldViewPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.listConfigurationChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  //onGetErrorMessage: null,
                  deferredValidationTime: 0,
                  key: 'viewPickerFieldId'
                }),
                PropertyFieldIconPicker('iconPicker', {
                  currentIcon: this.properties.iconPicker,
                  key: "iconPickerId",
                  onSave: (icon: string) => { console.log(icon); this.properties.iconPicker = icon; this.render() },
                  onChanged: (icon: string) => { console.log(icon); },
                  buttonLabel: "Choose an icon",
                  renderOption: "panel",
                  properties: this.properties,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  label: "Icon Picker"
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
