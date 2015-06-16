/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

define(function (require, exports, module) {
    "use strict";

    var React = require("react"),
        Fluxxor = require("fluxxor"),
        FluxMixin = Fluxxor.FluxMixin(React),
        _ = require("lodash"),
        Datalist = require("jsx!js/jsx/shared/Datalist"),
        Immutable = require("immutable");
        
    var SearchBar = React.createClass({
        mixins: [FluxMixin],

        propTypes: {
            dismissDialog: React.PropTypes.func
        },

        getDefaultProps: function () {
            return {
                dismissDialog: _.identity
            };
        },
  
        /**
         * Dismiss the parent dialog
         *
         * @param {SyntheticEvent} event
         */
        _dismissDialog: function (event) {
            if (_.isFunction(this.props.dismissDialog)) {
                this.props.dismissDialog(event);
            }
        },

        /**
         * Select the layer or document specified and dismiss the dialog
         *
         * @param {string} id
         */

        _handleChange: function (id) {
            if (id === null) {
                this.props.dismissDialog();
                return;
            }

            var idArray = id.split("_"),
                type = idArray.length === 2 ? idArray[0] : "",
                idInt = idArray.length === 2 ? parseInt(idArray[1]) : parseInt(id),
                flux = this.getFlux();

            switch (type) {
            case "layer":
                var document = flux.store("application").getCurrentDocument(),
                    selected = document.layers.byID(idInt);

                if (selected) {
                    flux.actions.layers.select(document, selected);
                }
                break;
            case "curr-doc":
                var selectedDoc = flux.store("document").getDocument(idInt);
                
                if (selectedDoc) {
                    flux.actions.documents.selectDocument(selectedDoc);
                }
                break;
            }
            this.props.dismissDialog();
        },

        /**
         * Get the class name for the layer face icon for the layer
         *
         * @private
         * @param {Layer} layer
         * @return {string}
         */
        _getSVGInfo: function (layer) {
            var iconID = "layer-";
            if (layer.isArtboard) {
                iconID += "artboard";
            } else if (layer.kind === layer.layerKinds.BACKGROUND) {
                iconID += layer.layerKinds.PIXEL;
            } else if (layer.kind === layer.layerKinds.SMARTOBJECT && layer.isLinked) {
                iconID += layer.kind + "-linked";
            } else {
                iconID += layer.kind;
            }
            
            return iconID;
        },

        /**
         * Get the layer ancestry
         *
         * @private
         * @param {Layer} layer
         * @return {string}
         */
        _formatLayerAncestry: function (layer) {
            var layerTree = this.getFlux().store("application").getCurrentDocument().layers,
                ancestors = layerTree.ancestors(layer),
                ancestorNames = ancestors.first().name;

            ancestors.skip(1).forEach(function (ancestor) {
                ancestorNames += ("/" + ancestor.name);
            });
            return ancestorNames;
        },

        /**
         * Make list of layers in the current document to be used as dropdown options
         * 
         * @return {Array.<Object>}
         */
        _getLayerOptions: function () {
            // get list of layers
            var appStore = this.getFlux().store("application"),
                document = appStore.getCurrentDocument(),
                layers = document.layers.allVisible.reverse(),
                layerMap = layers.map(function (layer) {
                    // Used to determine the layer face icon
                    var iconID = this._getSVGInfo(layer),
                        ancestry = this._formatLayerAncestry(layer);

                    return {
                        id: "layer_" + layer.id.toString(),
                        title: layer.name,
                        info: ancestry,
                        svgType: iconID,
                        type: "item"
                    };
                }.bind(this)),

                layerLabel = {
                    id: "layer_header",
                    title: "Layers",
                    type: "header"
                },

                layerOptions = layerMap.unshift(layerLabel);

            return layerOptions;
        },

        /**
         * Make list of currently open documents to be used as dropdown options
         * 
         * @return {Array.<Object>}
         */
        _getCurrDocOptions: function () {
            var appStore = this.getFlux().store("application"),
                docStore = this.getFlux().store("document"),
                document = appStore.getCurrentDocument(),
                openDocs = Immutable.fromJS(appStore.getOpenDocumentIDs()).filterNot(function (doc) {
                                return doc === document.id;
                            }),
                docMap = openDocs.map(function (doc) {
                    return {
                        id: "curr-doc_" + doc.toString(),
                        title: docStore.getDocument(doc).name,
                        type: "item"
                    };
                }),

                docLabel = {
                    id: "curr-doc_header",
                    title: "Documents",
                    type: "header"
                },

                docOptions = docMap.unshift(docLabel);

            return docOptions;
        },

        /**
         * Make list of items and headers to be used as dropdown options
         * @return {Array.<Object>}
         */
        _getSelectOptions: function () {
            var layerOptions = this._getLayerOptions(),
                docOptions = this._getCurrDocOptions();
           
            return layerOptions.concat(docOptions);
        },

        render: function () {
            var searchOptions = this._getSelectOptions();

            return (
                <div
                    onClick={this.props.dismissDialog}>
                   <Datalist
                    live={false}
                    className="dialog-search-bar"
                    options={searchOptions}
                    size="column-25"
                    startFocused={true}
                    placeholderText="Type to search"
                    onChange={this._handleChange}
                    />
                </div>
            );
        }
    });

    module.exports = SearchBar;
});