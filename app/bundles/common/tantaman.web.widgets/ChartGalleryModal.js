/*
 @author Matt Crinklaw-Vogt
 */
define(['libs/backbone'],
        function (Backbone) {
            var modalCache = {};
            var Modal = Backbone.View.extend({
                className: "chartGallery modal hide",
                events: {
                    "click .ok": "okClicked",
                    "click .prev": "prevPage",
                    "click .next": "nextPage",
                    "click .thumbnail": "_selectChart",
                    "hidden": "hidden"
                },
                initialize: function () {
                    this.selectedCharts = {};
                },
                okClicked: function () {
                    if (!this.$el.find(".ok").hasClass("disabled")) {
                        $.each(this.selectedCharts, function (i, selectedChart) {
                            this.cb(selectedChart); // cb = GalleryComponentButton._itemImported() 
                        }.bind(this));
                        this.selectedCharts = {};
                        return this.$el.modal('hide');
                    }
                },
                show: function (cb) {
                    this.cb = cb;
                    return this.$el.modal('show');
                },
                _showGallery: function (page) {
                    var perPage = 10;
                    this.galleryElement = this.$el.find("#chart-gallery-body");
                    
                    //to prevent loading same gallery again if popup closed and opened. 
                    if (this.galleryElement.find(".thumbnail").length != 0 && (page == undefined || page.trim() == ""))
                        return;
                    page = page ? page : 0;
                    this.galleryElement.empty();
//                    $.ajax({
//                        url: page ? page : "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/charts",
//                        beforeSend: function (xhr) {
//                            xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
//                        },
//                        data: {
//                          "perPage": perPage, "offset": perPage*page,
//                        },
//                        success: function (resp) {
//                            console.log(resp);
//                        }
//                    });
                    // building dummy response to work until we get api ready
                    var resp = {"total": 338, "next": "/v1/charts?offset=0&perPage=0", "perPage": 10, "offset": 0, "prev": "/v1/charts?offset=0&perPage=0", "results": [{"chartId": "MXzSwyM=", "chartType": "BAR_CHART", "height": 600, "subType": "100%", "width": 520, "chartName": "Standard Account Sample: Facebook Penetration", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzSwyM="}, {"chartId": "MXzSwis=", "chartType": "BAR_CHART", "height": 400, "subType": "clustered", "width": 560, "chartName": "Free Account Sample: The Social Media Landscape", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzSwis="}, {"chartId": "MXzQwiM=", "chartType": "BAR_CHART", "height": 400, "subType": "clustered", "width": 560, "chartName": "Facebook Users", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzQwiM="}, {"chartId": "MXzRyS0=", "chartType": "AREA_CHART", "height": 400, "subType": null, "width": 560, "chartName": "User Population", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzRyS0="}, {"chartId": "MXzRzi8=", "chartType": "LINE_CHART", "height": 400, "subType": "", "width": 560, "chartName": "Total", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzRzi8="}, {"chartId": "MXzRzCM=", "chartType": "LINE_CHART", "height": 400, "subType": "", "width": 450, "chartName": "Facebook Penetration", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzRzCM="}, {"chartId": "MXzWyis=", "chartType": "BAR_CHART", "height": 400, "subType": "stacked", "width": 450, "chartName": "Users and Non-Users", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzWyis="}, {"chartId": "MXzWyik=", "chartType": "AREA_CHART", "height": 400, "subType": null, "width": 450, "chartName": "Social Media Users", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzWyik="}, {"chartId": "MXzWyiM=", "chartType": "LINE_CHART", "height": 400, "subType": "", "width": 450, "chartName": "Social Media Users Across Platforms", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzWyiM="}, {"chartId": "MXzWySM=", "chartType": "COLUMN_CHART", "height": 450, "subType": "clustered", "width": 560, "chartName": "iPad Ownership", "imageURL": "stageaccounts2.icharts.net/icharts/chartImage.jsp?id=MXzWySM="}]};
                    var galleryData = {
                        previous: resp.previous,
                        next: resp.next,
                        offset: resp.offset, //<index of the first object returned in this query>
                        total: resp.total, //<total number of objects>
                        perPage: resp.perPage
                    };
                    this.galleryElement.data("gallery", galleryData);
                    this._thumbnailProperties = this._getThumbnailProperties(resp.perPage);
                    var chartList = resp.results;
                    $.each(chartList, function (i, v) {
                        if (i >= resp.perPage)
                            return false;
                        this._showChartThumbnail(v, resp.offset+i);
                    }.bind(this));

                },
                _getThumbnailProperties: function (perPage) {
                    var totalWidth = this.galleryElement.width();
                    var perRow = 4;
                    var margin = 16;
                    var width = (totalWidth - (perRow * margin * 2)) / perRow;
                    return {"width": width, "margin": margin};
                },
                _showChartThumbnail: function (chartData, chartNumber) {
                    var gallery = this.galleryElement;
                    var buffer = '';
                    console.log(chartData);
                    buffer += '<div id="chart-gallery-' + chartNumber + '" data-chartid ="'+chartData.chartId+'" class="thumbnail">' +
                            '<div class="title"><p>' + chartData.chartName + '</p></div>' +
                            '</div>';
                    gallery.append(buffer);
                    var chartThumbnail = $("#chart-gallery-" + chartNumber);

                    chartThumbnail.css({
                        "width": this._thumbnailProperties.width,
                        "margin": this._thumbnailProperties.margin + "px",
                        "background-image": 'url(\"' + "https://"+ chartData.imageURL + '\")'
                    });
                    var location = "stageaccounts2.icharts.net";

                    chartData.url = "https://" + location + "/?chartid=" + chartData.chartId + "&charttype=" + chartData.chartType + "&subtype=" + chartData.subType + "&authentication={}";

                    chartThumbnail.data("chart", chartData);
                },
                prevPage: function () {
                    var galleryData = $("#chart-gallery-body").data("gallery");
                    this._showGallery(galleryData.previous);
                },
                nextPage: function () {
                    var galleryData = $("#chart-gallery-body").data("gallery");
                    this._showGallery(galleryData.next);
                },
                _selectChart: function (e) {
                    var $this = $(e.currentTarget);
                    if ($this.hasClass("selected")) {
                        $this.removeClass("selected");
                        delete this.selectedCharts[$this.data("chart").chartId];
                    }
                    else {
                        $this.addClass("selected");

                        this.selectedCharts[$this.data("chart").chartId] = $this.data("chart");
                    }
                },
                hidden: function () {
                    if (this.$input != null) {
                        this.item.src = '';
                        return this.$input.val("");
                    }
                },
                _itemLoadError: function () {
                    this.$el.find(".ok").addClass("disabled");
                    return this.$el.find(".alert").removeClass("dispNone");
                },
                _itemLoaded: function () {
                    this._showGallery();
                    this.$el.find(".ok").removeClass("disabled");
                    return this.$el.find(".alert").addClass("dispNone");
                },
                // should probably just make a sub component to handle progress
                _updateProgress: function (ratio) {
                    this.$progressBar.css('width', ratio * 100 + '%');
                },
                _switchToProgress: function () {
                    this.$thumbnail.addClass('dispNone');
                    this.$progress.removeClass('dispNone');
                },
                render: function () {
                    var _this = this;
                    this.$el.html(JST["tantaman.web.widgets/ChartGalleryModal"](this.options));
                    this.$el.modal();
                    this.$el.modal("hide");
                    this.item = this.$el.find("#chart-gallery-body");

                    //to do : change this functionality based on chart selected in gallery
                    if (!this.options.ignoreErrors) {
                        this.item.onerror = function () {
                            return _this._itemLoadError();
                        };
                        this.item.onload = function () {
                            return _this._itemLoaded();
                        };
                    }

                    this.$progress = this.$el.find('.progress');
                    this.$progressBar = this.$progress.find('.bar');
                    return this.$el;
                },
                constructor: function ChartGalleryModal() {
                    Backbone.View.prototype.constructor.apply(this, arguments);
                }
            });

            return {
                //remembers the model if it is opened and returns it. No need of building template every time.  
                get: function (options) {
                    var previous = modalCache[options.tag];

                    if (!previous) {
                        previous = new Modal(options);
                        previous.$el.bind('destroyed', function () {
                            delete modalCache[options.tag];
                        });

                        modalCache[options.tag] = previous;

                        previous.render();
                        $('#modals').append(previous.$el);
                    }

                    return previous;
                },
                ctor: Modal
            };
        });