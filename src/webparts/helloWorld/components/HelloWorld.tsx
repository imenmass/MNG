// Import React and Fluent UI components
import * as React from 'react';
import { FocusZone, FocusZoneDirection } from '@fluentui/react/lib/FocusZone';
import { List } from '@fluentui/react/lib/List';
//import { Image, ImageFit } from '@fluentui/react/lib/Image';
import { ITheme, mergeStyleSets, getTheme, getFocusStyle } from '@fluentui/react/lib/Styling';
import { FontIcon } from '@fluentui/react/lib/Icon';
//import { IExampleItem } from '@fluentui/example-data';


// Import your existing styles and props
import styles from './HelloWorld.module.scss';
import { IHelloWorldProps } from './IHelloWorldProps';
import { ISPLists } from './ISPLists';

import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';

import { SPService } from '../../../services/SPListPickerService';
// Get Fluent UI theme
const theme: ITheme = getTheme();
const { palette, semanticColors, fonts } = theme;

// Define CSS class names
// Define CSS class names
const classNames = mergeStyleSets({
  container: {
    overflow: 'auto',
    maxHeight: 500,
  },


  hoverText: {
    '&:hover': {
      color: '#42a562', // Adjust the color as needed
    },
  },
  itemCell: [
    getFocusStyle(theme, { inset: -1 }),
    {
      minHeight: 54,
      padding: 10,
      boxSizing: 'border-box',
      borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      display: 'flex',

    },
  ],
  itemImage: {
    flexShrink: 0,
  },
  itemContent: {
    marginLeft: 10,
    overflow: 'hidden',
    flexGrow: 1,
  },
  itemName: [
    fonts.xLarge,
    {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',

    },
  ],
  itemIndex: {
    fontSize: fonts.small.fontSize,
    color: palette.neutralTertiary,
    marginBottom: 10,
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 10,
    color: palette.neutralTertiary,
    fontSize: fonts.large.fontSize,
    flexShrink: 0,
  },

  itemModified: [
    fonts.xSmall,
    {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }],

  IconStyle: {
    fontSize: 50,
    height: 50,
    width: 50,
    margin: '0 25px',
  }
});


const onRenderCell = (item: any, index: number = -1, isScrolling: boolean | undefined, selectedIcon: string, items: any, iconset: string, service: SPService, results: any): JSX.Element => {
  if (!item || !item.File || !item.File.Name) {
    // Handle the case where item or its properties are undefined (if applicable)
    return <div></div>;
  }

  // const handleDownload = (item: any): void => {
  //   // Implement your download logic here
  //   // You can use the item data to construct the download URL or perform any other necessary actions   
  //   console.log('Download clicked for:', item);
  // }
  return (
    <div className={classNames.itemCell} data-is-focusable={true}>
      <i className={`ms-Icon ms-Icon--ArrowDownload48Filled`} />
      <FontIcon aria-label="Compass" iconName={iconset} className={classNames.IconStyle} onClick={() => service.downloadFile("Shared%20Documents", "Classeur1.xlsx")} />

      <div className={classNames.itemContent}>
        <a
          href=""
          className={`${classNames.itemName} ${classNames.hoverText}`}
          style={{ color: 'inherit' }}
          onClick={() => service.downloadFile("Shared%20Documents", "Classeur1.xlsx")}
        >
          {item.File.Name}
        </a>

        <div className={classNames.itemModified}>{item.Modified}</div>
        {index !== -1 && (
          <div className={classNames.itemIndex}>{`Item ${index}`}</div>
        )}
      </div>
    </div>
  );
};

interface IHelloWorldState {
  items: []; // Adjust the type based on the actual structure of your items
  listViewData: ISPLists[]
  results: []
}

interface IListGhostingExampleProps {
  items: [];
  selectedIcon: string;
  //downloadFile: (text: string) => void;
  iconset: string
  service: SPService
  results: []

}
const ListGhostingExample: React.FunctionComponent<IListGhostingExampleProps> = ({ selectedIcon, items, iconset, service, results }) => {
  // Create a constant list of items
  //const items = useConst(() => createListItems(5));

  // Render the component
  return (
    <FocusZone direction={FocusZoneDirection.vertical}>
      <div className={classNames.container} data-is-scrollable>
        <List style={{ color: 'white' }} items={items} onRenderCell={(item, index, isScrolling) => onRenderCell(item, index, isScrolling, selectedIcon, items, iconset, service, results)} />
      </div>
    </FocusZone>
  );
};

// Your existing HelloWorld component
export default class HelloWorld extends React.Component<IHelloWorldProps, IHelloWorldState, {}> {
  public SPService: SPService;
  constructor(props: any) {
    //const [items, setItems] = useState<any[]>([]);
    super(props);
    // Set initial state
    this.state = {
      items: [],
      listViewData: [],
      results: []
    };

    this.SPService = new SPService(this.props.context);
  }



  public getListViewData(): Promise<ISPLists[]> {
    return new Promise<ISPLists[]>((resolve, reject) => {
      let listid = this.props.list; // The display name of the SharePoint list.
      let viewId = this.props.selectedView; // The View Name

      SPService.getViewQueryForList(listid, viewId).then((res: any) => {
        SPService.getItemsByViewQuery(listid, res).then((items: ISPLists[]) => {
          resolve(items);
        }).catch(reject);
      }).catch(reject);
    });
  }

  getDocuments = (): Promise<any> => {
    return this.props.context.spHttpClient.get(
      `${this.props.context.pageContext.web.absoluteUrl}/_api/web/Lists/GetById('${this.props.list}')/items?$select=Title,Modified,UniqueId,File/Name,File/Size,File/Length&$expand=File`,
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
  public async getDocumentsWithCamlQuery(listId: string): Promise<any> {
    //test2
    try {
      const apiUrl = `${this.props.context.pageContext.web.absoluteUrl}/_api/web/lists/getbyid('${listId}')/getitems?$select=Title,Modified,UniqueId,File/Name,File/Size,File/Length&$expand=File`;
  
      // Define the type of the query object
      const query: any = {
        ViewXml: '<View><Query><Where><Eq><FieldRef Name="ID" /><Value Type="Counter">18</Value></Eq></Where></Query></View>'
      };
  
      const spHttpClientOptions: any = {
        body: JSON.stringify({ query }),
        headers: {
          'Accept': 'application/json', // Corrected value for Accept header
          'Content-Type': 'application/json'
        }
      };
  
      const response: SPHttpClientResponse = await this.props.context.spHttpClient.post(apiUrl, SPHttpClient.configurations.v1, spHttpClientOptions);
  
      if (!response.ok) {
        const errorJson: any = await response.json();
        throw new Error(errorJson.error ? errorJson.error.message : response.status.toString());
      }
  
      const jsonData: any = await response.json();
      console.log('Response data:', jsonData); // Log the response data
      const returnValue = jsonData.value || jsonData;
  
      return returnValue;
    } catch (error) {
      console.error('Error retrieving documents:', error);
      throw error;
    }
  }
  
  



  public componentDidMount(): void {
    this.getDocumentsWithCamlQuery("fb979a32-a738-4388-9f81-81279c87841c")
      .then(response => {
        this.setState({ items: response });
      }).catch(error => {
        console.error("Error fetching documents:", error);
      });
    this.getDocuments()
      .then(response => {
        this.setState({ items: response });
      })
      .catch(error => {
        console.error("Error fetching documents:", error);
      });

    this.getListViewData()
      .then(response => {
        this.setState({ listViewData: response });
      })
      .catch(error => {
        console.error("Error fetching list view data:", error);
      });
  }


  public render(): React.ReactElement<IHelloWorldProps> {
    return (
      <div className={styles.yourWebPart}>
        <div className={styles.container}>
          <div className={styles.square}>
            <h1 style={{ color: 'white' }}>{this.props.title}</h1>
            <hr></hr>
            {/* Render the Fluent UI List with ghosting */}
            <ListGhostingExample selectedIcon={this.props.selectedIcon} items={this.state.items} iconset={this.props.iconPicker} service={this.SPService} results={this.state.results} />
          </div>
        </div>
      </div>
    );
  }

}

