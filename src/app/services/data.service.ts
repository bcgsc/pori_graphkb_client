import { Component, NgModule, Injectable, EventEmitter, AfterViewInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Ontology } from '../models/ontology';
import { GraphNode } from '../models';
import { GraphLink } from 'src/app/models/graph-link';
import { APIService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';

@Injectable()
export class DataService {
    public selectedNode = new EventEmitter<any>();
    private _dataMap: any;

    get dataMap() {
        return this._dataMap;
    }
    set dataMap(data) {
        this._dataMap = data
    }

    constructor(private api: APIService){}

    public getQuery(params): Observable<any>{
       return this.api.query(params).pipe(map((json) => {
            this._dataMap = {};
  
            json.forEach(diseaseTerm => {
  
                let entry = this.prepareEntry(diseaseTerm);
                this._dataMap[entry["@rid"]] = entry;
            });
            return this._dataMap;
        }));
    }
    
    /**
       * Processes json disease term into front end model.
       * @param jsonTerm disease ontology term in JSON form as returned from
       * the server.
       */
    public prepareEntry(jsonTerm: JSON): Ontology {
        let children, parents, aliases;

        if (jsonTerm['out_SubClassOf']) {
            parents = [];
            jsonTerm['out_SubClassOf'].forEach(edge => {
                edge['in']['@rid'] ? parents.push(edge['in']['@rid']) : parents.push(edge['in'])
            });
        }
        if (jsonTerm['in_SubClassOf']) {
            children = [];
            jsonTerm['in_SubClassOf'].forEach(edge => {
                edge['out']['@rid'] ? children.push(edge['out']['@rid']) : children.push(edge['out'])
            });
        }
        if (jsonTerm['out_AliasOf']) {
            aliases = [];
            jsonTerm['out_AliasOf'].forEach(edge => {
                edge['in']['@rid'] ? aliases.push(edge['in']['@rid']) : aliases.push(edge['in'])
            });
        }
        if (jsonTerm['in_AliasOf']) {
            aliases = aliases || [];
            jsonTerm['in_AliasOf'].forEach(edge => {
                edge['out']['@rid'] ? aliases.push(edge['out']['@rid']) : aliases.push(edge['out'])
            });
        }

        let entry: Ontology = {
            '@class': jsonTerm['@class'],
            sourceId: jsonTerm['sourceId'],
            createdBy: jsonTerm['createdBy']['name'],
            name: jsonTerm['name'],
            description: jsonTerm['description'],
            source: jsonTerm['source'],
            '@rid': jsonTerm['@rid'],
            longName: jsonTerm['longName'],
            '@version': jsonTerm['@version'],
            subsets: jsonTerm['subsets'],
            parents: parents,
            children: children,
            aliases: aliases,
        }

        return entry;
    }

    /**
   * Helper function to format query result data for the tree view.
   */
  public getHierarchy(dataMap): Ontology[] {
    let roots: Ontology[] = [];

    Object.keys(dataMap).forEach(rid => {
      if (!dataMap[rid].parents) {
        roots.push(dataMap[rid]);
      } else {
        let retrieved = false;
        dataMap[rid].parents.forEach(pid => {
          if (pid in dataMap && !retrieved) {
            let parent = dataMap[pid];
            if (!('_children' in parent)) {
              parent._children = [];
            }
            parent._children.push(dataMap[rid]);
            retrieved = true;
          }
        });
        // If none of a node's parents are retrieved by query, the node is displayed as a root.
        if (!retrieved) {
          roots.push(dataMap[rid]);
        }
      }
    });
    return roots;
  }

  public initLinks(nodes: GraphNode[]): GraphLink[] {
    let links: GraphLink[] = [];
    nodes.forEach(node => {
      if (node.data.parents) {
        node.data.parents.forEach(childRid => {
          let pgn: GraphNode = nodes.filter(node => node.data["@rid"] == childRid)[0];
          if (pgn) {
            let l: GraphLink = links.filter(link => {
              return link.source == node && link.target == pgn && link.type == 'subclassof';
            })[0];
            if (!l) {
              pgn.linkCount++;
              node.linkCount++;
              links.push(new GraphLink(node, pgn, 'subclassof'));
            }
          }
        });
      }
      if (node.data.children) {
        node.data.children.forEach(childRid => {
          let cgn: GraphNode = nodes.filter(node => node.data["@rid"] == childRid)[0];
          if (cgn) {
            let l: GraphLink = links.filter(link => {
              return link.source == cgn && link.target == node && link.type == 'subclassof';
            })[0];
            if (!l) {
              cgn.linkCount++;
              node.linkCount++;
              links.push(new GraphLink(cgn, node, 'subclassof'));
            }
          }
        });
      }
      if (node.data.aliases) {
        node.data.aliases.forEach(alias => {
          let agn: GraphNode = nodes.filter(node => node.data["@rid"] == alias)[0];
          if (agn) {
            let l: GraphLink = links.filter(link => {
              return link.source == node && link.target == agn && link.type == 'aliasof';
            })[0];
            if (!l) {
              agn.linkCount++;
              node.linkCount++;
              links.push(new GraphLink(agn, node, 'aliasof'));
            }
          }
        });
      }
    });

    return links;
  }

  
  /**
   * Builds nodes
   */
  private initNodes(): GraphNode[] {
    let nodes = [];
    Object.keys(this.dataMap).forEach(key => {
        nodes.push(new GraphNode(key, this.dataMap[key]));
    });
    return nodes;
  }


}
