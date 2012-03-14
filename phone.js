winkstart.module('voip', 'phone', {
    css: ['css/style.css'],
    templates: {
        index: 'tmpl/index.html',
        phone: 'tmpl/phone.html',
        phonePopup: 'tmpl/phone_popup.html',
        create: 'tmpl/create.html',
        fields: 'tmpl/fields.html',
        new_template: 'tmpl/add_template.html'
    },

    subscribe: {
        'phone.activate': 'activate',
        'phone.edit': 'edit_phone',
        'phone.list': 'render_list',
        'phone.delete': 'delete_phone',
        'phone.create': 'create_phone',
        'phone.save': 'save_phone',
        'template.popup': 'popup_template',
        'phone.edit_popup': 'edit_popup',
        'phone.render_fields': 'render_fields'
    },

    resources: {
        'phone.update_template': {
            url: '{api_url}/accounts/{account_id}/provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'POST'
        },
        'phone.update_template_noimg': {
            url: '{api_url}/accounts/{account_id}/provisioner_templates/{phone_id}?withoutimage=true',
            contentType: 'application/json',
            verb: 'POST'
        },
        'phone.delete_template': {
            url: '{api_url}/accounts/{account_id}/provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'DELETE'
        },
        'phone.create': {
           url: '{api_url}/accounts/{account_id}/provisioner_templates',
            contentType: 'application/json',
            verb: 'PUT'
        },
        'phone.get_template': {
            url: '{api_url}/accounts/{account_id}/provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'GET'
        },
        'phone.get_template_noimg': {
            url: '{api_url}/accounts/{account_id}/provisioner_templates/{phone_id}?withoutimage=true',
            contentType: 'application/json',
            verb: 'GET'
        },
        'phone.list_template': {
            url: '{api_url}/accounts/{account_id}/provisioner_templates',
            contentType: 'application/json',
            verb: 'GET'
        }
    }
}, function (args) {
    winkstart.registerResources(this.__whapp, this.config.resources);

    if('ui_flags' in winkstart.apps.voip && winkstart.apps.voip.ui_flags.provision_admin) {
        winkstart.publish('subnav.add', {
            whapp: 'voip',
            module: this.__module,
            label: 'Provisioning',
            icon: 'outlet1',
            weight: '99'
        });
    }
},

{
    save_phone: function(phone_data, args) {
        var thisPhone = phone_data;
        if(thisPhone.id) {
            if(args.img) {
                winkstart.request(true, 'phone.update_template', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        phone_id: thisPhone.id,
                        data: thisPhone
                    },
                    function(_data, status) {
                        winkstart.publish('phone.list');
                    }
                );
            }
            else {
                var post_data = thisPhone;
                delete post_data.image;

                winkstart.request(true, 'phone.update_template_noimg', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        phone_id: thisPhone.id,
                        data: post_data
                    },
                    function(_data, status) {
                        winkstart.publish('phone.list');
                    }
                );
            }
        }
        else {
            winkstart.request(true, 'phone.create', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url,
                    data: thisPhone
                },
                function (_data, status) {
                    winkstart.publish('phone.edit', { id: _data.data.id });
                    winkstart.publish('phone.list');
                }
            );
        }
    },

    render_fields: function(parent, provision_data, callback) {
        var THIS = this,
            fields_html;

        winkstart.request(true, 'phone.list_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url
            },
            function(data, status) {
                var fields_data = {
                    data: data.data,
                    field_data: { selected_id: provision_data.id }
                };

                fields_html = THIS.templates.fields.tmpl(fields_data);

                // change here
                $('#dropdown', fields_html).change(function() {
                    if(confirm("If you change the template, the current provision information will be deleted, Are you sure you want to do that?")) {
                        provision_data.id = $('#dropdown', fields_html).val();
                        delete provision_data.template;
                        delete provision_data.settings;
                        delete provision_data.search;
                    }
                    else {
                        $('#dropdown', fields_html).val(provision_data.id);

                    }
                });

                $('#btn_provision_popup', fields_html).click(function() {
                    var id = $('#dropdown').val();

                    if(id) {
                        THIS.edit_popup({
                            id: id,
                            prevent_box_creation: true,
                            data: provision_data
                        });
                    }
                    else {
                        alert('Please select an option from the dropdown');
                    }
                });

                (parent)
                    .empty()
                    .append(fields_html);

                if(typeof callback == 'function') {
                    callback();
                }
            }
        );

        /* Nice hack for amplify.publish */
        return false;
    },

    edit_popup: function (args) {
        var THIS = this;

        winkstart.request(true, 'phone.get_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url,
                phone_id: args.id
            },
            function(_data, status) {
                var A = $.extend(true, {}, _data.data);
                var B = $.extend(true, {}, args.data);
                var C = $.extend(true, {}, A, B);

                A.template = C.template;
                B.template = C.template;

                A.search = C.search;
                B.search = C.search;

                var popup, popup_html;

                popup_html = $('<div class="inline_popup"><div class="inline_content"/></div>');

                $('.inline_content', popup_html).html(THIS.templates.phonePopup.tmpl({
                    phone_data: A
                }));
                var dialog = winkstart.dialog(popup_html, { title: 'Edit Provisioning' });

                if (B.search == null) {
                    B.search = {};
                }

                if (B.search.used_items == null) {
                    B.search.used_items = {};
                }

                if (B.settings == undefined) {
                    B.settings = {};
                }

                if (B.settings.button_boxes == undefined) {
                    B.settings.button_boxes = {};
                }

                $.each(A.settings.button_boxes, function () {
                    addExistingResizables(this, A, false, false);
                });

                $.each(B.settings.button_boxes, function () {
                    addExistingResizables(this, B, true, false);
                });

                $('.phone-update', dialog).click(function() {
                    //MAJ object
                    $.extend(args.data, THIS.crazy_clean(B));

                    dialog.dialog('destroy').remove()
                });

                if(args.prevent_box_creation == undefined || args.prevent_box_creation == false) {
                    $('#photo', dialog).dblclick(function(event) {
                        addResizable(event, B, true, false);
                    });
                }
            }
        );

        $('#phone-view').empty();
    },

    crazy_clean: function(phone_data) {
        var new_phone_data,
            template_data = $.extend(true, {}, phone_data.template),
            search_data = {
                used_items: {}
            };

        $.each(template_data.data, function(key1, val1) {
            $.each(val1, function(key2, val2) {
                $.each(val2, function(key3, val3) {
                    $.each(val3, function(key4, val4) {
                        if(!('value' in val4)) {
                            if($.isArray(val3)) {
                                val3.splice(key4, 1);
                            }
                            else {
                                delete val3[key4];
                            }
                        }
                    });

                    if(($.isArray(val3) && val3.length == 0) || $.isEmptyObject(val3)) {
                        delete val2[key3];
                    }
                });

                if($.isEmptyObject(val2)) {
                    delete val1[key2];
                }
            });

            if($.isEmptyObject(val1)) {
                delete template_data.data[key1];
            }
        });

        $.each(phone_data.settings.button_boxes, function(index, box) {
            $.each(box.vars, function(key, val) {
                search_data.used_items[key] = val;
            });
        });

        new_phone_data = {
            template: template_data,
            search: search_data,
            settings: $.extend(true, {}, phone_data.settings)
        };

        return new_phone_data;
    },

    edit_phone: function (args) {
        var THIS = this;

        winkstart.request(true, 'phone.get_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url,
                phone_id: args.id
            },
            function(_data, status) {
                var A = _data.data;
                var form_data = {
                    'thisPhone': A
                };

                $('#phone-view').html(THIS.templates.phone.tmpl(form_data));

                if (A.search == null) {
                    A.search = {};
                }

                if (A.search.used_items == null) {
                    A.search.used_items = {};
                }

                if (A.settings == undefined) {
                    A.settings = {};
                }

                if (A.settings.button_boxes == undefined) {
                    A.settings.button_boxes = {};
                }

                $.each(A.settings.button_boxes, function () {
                    addExistingResizables(this, A, true, true);
                });

                if(args.prevent_box_creation == undefined || args.prevent_box_creation == false) {
                    $('#photo').dblclick(function(event) {
                        addResizable(event, A, true, true);
                    });
                }

                var details = '&brand=' + A.properties.brand + '&product=' + A.properties.product + '&model=' + A.properties.model;

                $('.phone-delete').click(function () {
                    winkstart.publish('phone.delete', {
                        id: args.id
                    });
                });

                $('.phone-update').click(function() {
                    A.name = $('#template_description', '#main').val();
                    winkstart.publish('phone.save', A, { img: false });
                });

                // TODO: Move to Winkstart
                /*$.ajax({
                    type: 'GET',
                    url: 'http://www.provisioner.net/beta/merge_data.php?request=data' + details,
                    dataType: 'text',
                    success: function (data) {
                    }
                });*/
            }
        );

        $('#phone-view').empty();
    },

    delete_phone: function (args) {
        winkstart.request(true, 'phone.delete_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url,
                phone_id: args.id
            },
            function(_data, status) {
                $('#phone-view').empty();
                winkstart.publish('phone.list');
            }
        );
    },

    /* Builds the generic data list on the left hand side. It's responsible for gathering the data from the server
     * and populating into our standardized data list 'thing'.
     */
    render_list: function () {
        console.log('render_list');
        var THIS = this;

        function map_crossbar_data(crossbar_data) {
            var new_list = [];
            for (var i in crossbar_data) {
                new_list.push({
                    id: crossbar_data[i].id,
                    title: crossbar_data[i].name
                });
            }
            return new_list;
        }

        winkstart.request(true, 'phone.list_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url
            },
            function (data, status) {
                json = data;

                var options = {
                    'label': 'Phone Module',
                    'identifier': 'phone-module-listview',
                    'new_entity_label': 'phone',
                    'data': map_crossbar_data(json.data),
                    'publisher': winkstart.publish,
                    'notifyMethod': 'phone.edit',
                    'notifyCreateMethod': 'phone.create'
                };

                $('#phone-listpanel').empty();
                $('#phone-listpanel').listpanel(options);
            }
        );
    },

    create_phone: function () {
        var THIS = this;

        $('#phone-view').html(THIS.templates.create.tmpl());
        $('#phone-view').append('<div id="drop-box-overlay"><h1>Drop files anywhere to upload...</h1></div> ')
        initDnD();
    },

    popup_template: function (args) {
        var THIS = this,
            w = args.data.w,
            h = args.data.h,
            img = args.data.img,
            add_template_html = THIS.templates.new_template.tmpl(args),
            popup = $(add_template_html).dialog({
                width: '420px',
                modal: true,
                resizable: false,
                title: 'Add new template'
            });

        $('#add_new_template', add_template_html).click(function() {
            var val = $('.model_select:visible', add_template_html).first().val().split('_'); //brand_product_model
            addTemplate(w, h, img, val[2], val[1], val[0], $('#template_name', add_template_html).val());

            $(this).dialog('destroy').remove();
        });

        $('#cancel', add_template_html).click(function() {
            $(this).dialog('destroy').remove();
        });

        //TODO JR: why brand yealink
        var brand = 'yealink'; // initialization_value
        $('#brand', add_template_html).val(brand);
        $('.model_select', add_template_html).hide();
        $('#model_select_'+brand, add_template_html).show();

        $('#brand', add_template_html).bind('change keyup', function () {
            brand = $(this).val();
            console.log(brand);
            $('.model_select', add_template_html).hide();
            $('#model_select_'+brand, add_template_html).show();
        });
    },

    activate: function (data) {
        console.log('activate');

        var THIS = this;
        $('#ws-content').empty();

        THIS.templates.index.tmpl().appendTo($('#ws-content'));

        winkstart.publish('layout.updateLoadedModule', {
            label: 'phone',
            module: this.__module
        });

        winkstart.publish('phone.list');
    }
});

/* End of Winkstart Module ^ */
function ucwords(str) {
    var capitalized_string = (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });

    return capitalized_string;
}

function addExistingResizables(data, phone_data, admin, set_default) { //Uses data from DB to add each resizable
    console.log('addExistingResizables');
    var i = parseFloat(data.id);
    var maxId = parseFloat($('#photo').dataset('maxId'));

    if (i != '') {
        var width = data.w,
            height = data.h,
            boxTop = data.y,
            boxLeft = data.x,
            title = (data.title ? data.title : ''),
            id = 'resizable_' + i;

        if(i > maxId) {
            $('#photo').attr('data-maxId', i);
        }


        $('#photo').prepend('<div id="' + id + '" class="resizable ui-widget-content ui-corner-all transparent_class" style="top:' + boxTop + 'px; left: ' + boxLeft + 'px; width: ' + width + 'px; height: ' + height + 'px;"><div class="box-title">' + title + '</div></div>');

        if(!data.editable && !admin) {
            $('#'+id, '#photo').addClass('non_editable');
        }

        activateResizable(id, phone_data, admin, set_default);
    }
}

/* Saves change made in the GUI inside the thisPhone variable. */
function saveConfig(diag_id, phone_data, set_default) {
    console.log('saveConfig: ' + diag_id);
    $('#' + diag_id + '-formdata :input:not(:button)').each(function (index) {
        var id = $(this).attr('data-id'),
            cat = $(this).attr('data-catagory'),
            key = $(this).attr('data-key'),
            subkey = $(this).attr('data-subkey'),
            sec = $(this).attr('data-section');

        var val = $(this).val();
        if ($(this).is(':checkbox')) {
            $(this).is(':checked') ? val = 'checked' : val = 'off';
        }

        if(set_default) {
            if (sec && cat && key) {
                phone_data.template.data[sec][cat][key][subkey]['default_value'] = val;
            }
        }
        else {//ADMIN
            phone_data.template.data[sec][cat][key][subkey]['value'] = val;
        }
    });
}

function deleteSingleConfig(target, phone_data) {
    var id = $(target).attr('data-id'),
        cat = $(target).attr('data-catagory'),
        key = $(target).attr('data-key'),
        subkey = $(target).attr('data-subkey'),
        sec = $(target).attr('data-section');

    if (sec && cat && key) {
        delete phone_data.template.data[sec][cat][key][subkey].value;
    }
}

function deleteConfig(diag_id, phone_data) {
    $('#' + diag_id + '-formdata :input:not(:button)').each(function (index) {
        deleteSingleConf($(this), phone_data)
    });
}

function initResizable(resizable, phone_data, admin, set_default) {
    console.log('initResizable');
    //$('#photo').delegate('.resizable', 'click', function () { //Active Selection Logic for resizable boxes
    (resizable).click(function() {
        var id = (($(this).attr('id')).split('_'))[1],
            text_id = '#text_resizable_' + id,
            context = this,
            tempFeatureList = {},
            tempDisabledFeatureList = {};

        $('.resizable').each(function (num, elem) {
            if ($(elem).hasClass('ui-state-highlight') && elem != context) {
                var num_id = (($(this).attr('id')).split('_'))[1];
                var elem_id = '#text_resizable_' + num_id;
                $(elem_id).add(elem).removeClass('ui-state-highlight');
            }
        });

        $(text_id).add(this).toggleClass('ui-state-highlight', function () {
            return $(this).hasClass('ui-state-highlight');
        });
        diag_search = searchTerms('', id, phone_data);

        var diag_id = 'dialog_' + id;
        var search_box_id = 'search-box_' + id;
        var search_id = 'search-container-' + id;
        var title = (phone_data.settings.button_boxes[id].title ? phone_data.settings.button_boxes[id].title : '');
        var editable = phone_data.settings.button_boxes[id].editable;
        var htmlChecked = editable ? 'checked="CHECKED"' : '';

        $('body').append("<div id='" + diag_id + "' style='display:none'><div id='" + diag_id + "-options'></div>");

        if (admin) {
            $('#' + diag_id).prepend("<div><fieldset class='provisioner admin'><legend>Admin Area</legend>" + "<div>Title:&nbsp; <input type='text' id='box_title' class='fancy' style='width:300px;' value='" + title + "' /></div>" + "<div>Check this if you want to allow the user to edit this box. <input type='checkbox' id='editable_checkbox'" + htmlChecked + "/></div>" + "<div>Filter: <input type='text' id='" + search_box_id + "' class='fancy' style='width:300px;' /></div>" + "<div><div id='" + search_id + "'>" + diag_search + "</div></div></fieldset><div style='clear:both;'/></div>" + "<hr style='clear:both;'/></div></div>");

            $('#' + search_box_id).keyup(function (event) {
                var id = (($(this).attr('id')).split('_'))[1];
                var search_id = 'search-container-' + id;
                var terms = searchTerms($(this).val(), id, phone_data);

                $('#' + search_id).empty().html(terms).masonry('reload');
            });
        }
        var temp_content = '';

        //This recreates buttons from the last save.
        //var list = isAdmin() ? thisPhone.template.data : extend(true, {}, thisPhone.template, user_data);; ADMIN
        var list = phone_data.template.data;
        $.each(list, function (i, data) {
            for (var key2 in data) {
                for (var key in data[key2]) {
                    loop = (key.substring(0, 7).toLowerCase() != 'option|' ? true : false);
                    if (phone_data.settings.button_boxes[id].vars[key]) {
                        key_read = keyRead(key);
                        if (!admin) { //ADMIN
                            $.each(data[key2][key], function (k, data) {
                                this['default_value'] = phone_data.template.data[i][key2][key][k]['default_value'];
                            });
                        }
                        temp_content += makeInput(data[key2][key], loop, key_read, id, key, key2, i, admin, set_default);
                    }
                }
            }
        });

        temp_content = "<form id='" + diag_id + "-formdata' onsubmit='return false;'>" + temp_content + "</form>";
        $('#' + diag_id + '-options').html(temp_content);

        var btns = {
            'Save': function () {
                title = $('#box_title', this).val();
                editable = $('#editable_checkbox', this).is(':checked');
                phone_data.settings.button_boxes[id].title = title;
                phone_data.settings.button_boxes[id].editable = editable;
                $('#resizable_' + id + ' .box-title').html(title);
                saveConfig(diag_id, phone_data, set_default);
                $(this).dialog('destroy').remove();
            },
            'Cancel': function () {
                $.each(tempFeatureList, function (k, i) {
                    unsetUsedSearch(i, k, phone_data);
                });
                tempFeatureList = {};
                $.each(tempDisabledFeatureList, function (k, i) {
                    setUsedSearch(i, k, phone_data);
                });
                tempDisabledFeatureList = {};
                $(this).dialog('destroy').remove();
            },
            'Delete': function () {
                var box = '#resizable_' + id;
                confirmBox('Are you sure you want to delete this box?', function (confirm) {
                    if (confirm) {
                        $(box).fadeOut(400);
                        var vars = phone_data.settings.button_boxes[id].vars;
                        for (var key in vars) {
                            unsetUsedSearch(id, key, phone_data);
                        }
                        delete phone_data.settings.button_boxes[id];
                        if(!set_default) {
                            deleteConfig(diag_id, phone_data);
                        }
                    }
                });
                $(this).dialog('destroy').remove();
            }
        };

        if(!admin) {
            delete btns.Delete;
        }

        $('#' + diag_id).dialog({
            width: 'auto',
            modal: true,
            title: 'Edit Hot Spot',
            buttons: btns,
            close: function (event, ui) {
                $(this).dialog('destroy').remove();
            }
        });

        //TODO: fix this
        $('#' + diag_id).css('max-height', '600px'); //setting maxHeight on the dialog was not working properly.
        width = 800;
        $('#' + diag_id).css('min-width', width + 'px'); //setting maxHeight on the dialog was not working properly.

        if(admin) {
            $('#' + search_id).masonry({
                itemSelector: '.search-item',
                columnWidth: 50,
                isAnimated: true
            });

            initDialogTrash();
            $('#' + diag_id).delegate('.provisioner-remove', 'click', function () {
                $(this).parent().parent().parent().slideUp('slow').remove();
                var id = $(this).attr('data-id'),
                    key = $(this).attr('data-key');
                deleteSingleConfig($(':input:not(:button)', $(this).parents('.provisioner.w350')), phone_data);
                unsetUsedSearch(id, key, phone_data);
                key in tempFeatureList ? delete tempFeatureList[key] : tempDisabledFeatureList[key] = id;

                var terms = searchTerms($('#search-box_' + id).val(), id, phone_data);

                $('#' + search_id).empty();
                $('#' + search_id).html(terms);
                $('#' + search_id).masonry('reload');
            });

            $('#' + diag_id).delegate('#' + search_id + ' .search-item', 'click', function () { //Active Selection Logic for resizable boxes
                var id = (($(this).attr('data-id')).split('_'))[1],
                    cat = $(this).attr('data-catagory'),
                    key = $(this).attr('data-key'),
                    sec = $(this).attr('data-section'),
                    diag_id = 'dialog_' + id + '-formdata';

                loop = (key.substring(0, 7).toLowerCase() != 'option|' ? true : false);
                setUsedSearch(id, key, phone_data);
                key in tempDisabledFeatureList ? delete tempDisabledFeatureList[key] : tempFeatureList[key] = id;
                obj = phone_data.template.data[sec][cat][key];
                //obj['default_value'] = thisPhone.data == undefined ? '' : thisPhone.data[sec][cat][key]['default_value'];

                $(makeInput(obj, loop, keyRead(key), id, key, cat, sec)).hide().prependTo('#' + diag_id).slideDown('slow');

                initDialogTrash();

                $('#search-container-' + id).masonry('remove', $(this)).masonry('reload');
            });
        }
    });
}

function keyRead(key) {
    //console.log('keyRead');
    key_read = key.substring(key.indexOf('|') + 1, key.length);
    key_read = ucwords(key_read.replace(/_/g, ' '));
    return key_read;
}

function initDialogTrash() {
    console.log('initDialogTrash');
    $('.provisioner-remove').button({
        icons: {
            primary: 'ui-icon-trash'
        },
        text: false
    });
}

//This function generates the buttons, clickable and searchable
function searchTerms(term, id, phone_data) {
    console.log('searchTerms');
    var diag_search = '';
    $.each(phone_data.template.data, function (i, data) {
        for (var key2 in data) {
            for (var key in data[key2]) {
                key_read = keyRead(key);
                if (phone_data.search.used_items[key] == null) {
                    if (term == '' || key_read.toLowerCase().indexOf(term.toLowerCase()) != -1) {
                        diag_search += " <div class='search-item' data-section='" + i + "' data-catagory='" + key2 + "' data-id='search-item_" + id + "' data-key='" + key + "'><span>" + key_read + "</span></div> ";
                    }
                }
            }
        }
    });
    return diag_search;
}

function setUsedSearch(id, key, phone_data) {
    console.log('setUsedSearch');
    phone_data.search.used_items[key] = true;
    phone_data.settings.button_boxes[id].vars[key] = true;
}

function unsetUsedSearch(id, key, phone_data) {
    console.log('unsetUsedSearch');
    delete phone_data.search.used_items[key];
    delete phone_data.settings.button_boxes[id].vars[key];
}

function makeInput(obj, loop, title, id, key, key2, i, admin, set_default) {
    var all_content = '';

    for (var subkey in obj) {
        all_content += makeInputHTML(obj[subkey], key2, i, id, key, subkey, set_default);
    }

    del_button = (admin ? " - <button class='provisioner-remove' data-id='" + id + "' data-key='" + key + "'>Del</button> " : "");
    all_content = "<div class='variable-group'><fieldset class='provisioner w350'><legend>" + key_read + del_button + "</legend>" + all_content + "</fieldset> <div class='clr' /></div>";
    return all_content;
}

function makeInputHTML(obj, cat, sec, id, key, subkey, set_default) {
    console.log('makeInputHTML');
    saved_value = obj['value'] != undefined ? obj['value'] : obj['default_value'];

    //false is user mode (device or template)
    var val = (false ? obj['default_value'] : saved_value);

    all_content = '';
    switch (obj['type']) {
        case 'list':
            all_content += "<label>" + obj['description'] + "</label> <select data-section='" + sec + "' data-catagory='" + cat + "' data-id='" + id + "' data-key='" + key + "' data-subkey='" + subkey + "'>";
            for (var subsubsubkey in obj['data']) {
                var selected = (val == obj['data'][subsubsubkey]['value'] ? 'selected' : '');
                all_content += "<option value='" + obj['data'][subsubsubkey]['value'] + "' " + selected + ">" + obj['data'][subsubsubkey]['text'] + "</option>";
            }
            all_content += "</select><br />";
            break;

        case 'input':
            //TODO Need to replace this with stg less dumb than that
            val = typeof val == 'string' ? val.replace("'", "\"") : val;
            all_content += "<label>" + obj['description'] + "</label> <input type='text' name='" + obj['variable'] + "' class='fancy'  data-section='" + sec + "' data-catagory='" + cat + "' data-subkey='" + subkey + "' data-id='" + id + "' data-key='" + key + "' value='" + val + "' />";
            break;

        case 'checkbox':
            var option_checked;
            val == 'checked' ? option_checked = 'checked="checked"' : '';
            all_content += "<label>" + obj['description'] + "</label> <input type='checkbox' name='" + obj['variable'] + "' class='fancy'  data-section='" + sec + "' data-catagory='" + cat + "' data-subkey='" + subkey + "' data-id='" + id + "' data-key='" + key + "' " + option_checked + " />";
            break;
    }
    return all_content;
}

function activateResizable(id, phone_data, admin, set_default) {
    console.log('activateResizable');
    var selector_id = '#' + id;
    if(admin) {
        $(selector_id).resizable({
            handles: 'se',
            stop: function (event, ui) {
                sizeResizable(event, phone_data);
            }
        }).draggable({
            containment: '#photo',
            scroll: false,
            stop: function (event, ui) {
                moveResizable(event, phone_data);
            }
        }).css('cursor', 'move');
    }

    initResizable($(selector_id), phone_data, admin, set_default);
}

function sizeResizable(event, phone_data) { //write to db
    console.log('sizeResizable');
    var id = (event.target.id).split('_')[1];
    phone_data.settings.button_boxes[id].w = event.target.clientWidth;
    phone_data.settings.button_boxes[id].h = event.target.clientHeight;
}

function moveResizable(event, phone_data) { //write to db
    console.log('moveResizable');
    var id = (event.target.id).split('_')[1];
    phone_data.settings.button_boxes[id].x = event.target.offsetLeft;
    phone_data.settings.button_boxes[id].y = event.target.offsetTop;
}

function addResizable(event, phone_data, admin, set_default) {
    console.log('addResizable');
    var i = parseFloat($('#photo').dataset('maxId')) + 1;
    $('#photo').attr('data-maxId', i);

    var width = 46,
        height = 20,
        p = $('#photo'),
        position = p.offset(),
        boxTop = (event.pageY - position.top) - (height / 2),
        boxLeft = (event.pageX - position.left) - (width / 2),
        id = 'resizable_' + i;

    phone_data.settings.button_boxes[i] = {
        id: i,
        y: boxLeft,
        x: boxTop,
        h: height,
        w: width,
        vars: {},
        defs: {}
    };

    $('#photo').prepend('<div id="' + id + '" class="resizable ui-widget-content ui-corner-all transparent_class" style="top:' + boxTop + 'px; left: ' + boxLeft + 'px; width: ' + width + 'px; height: ' + height + 'px;"><div class="box-title"></div></div>');
    activateResizable(id, phone_data, admin, set_default);
}

function addTemplate(w, h, img, mdl, prdt, brnd, name) {
    console.log('addTemplate');
    $('#photo').css('width', w)
               .css('height', h)
               .css('background-image', 'url(' + img + ')');
    $('.resizable').remove();

    var phone_data = {
        name: name,
        properties: {
            brand: brnd,
            model: mdl,
            product: prdt
        },
        image: {
            height: h,
            width: w,
            base64: img
        },
        settings: {
            button_boxes: {}
        },
        search: {
            used_items: {}
        }
    }

    winkstart.publish('phone.save', phone_data, {img: true});
}

function confirmBox(msg, action) {
    console.log('confirmBox');
    $('body').prepend('<div id="dialog" title="Basic dialog"><p>' + msg + '</p></div>');

    $('#dialog').dialog({
        resizable: false,
        modal: true,
        buttons: {
            'OK': function () {
                action(1);
                $(this).dialog('close');
            },
            'Cancel': function () {
                action(0);
                $(this).dialog('close');
            }
        }
    });
}

// lets do some awesome drag and drop stuff!
function initDnD() {
    console.log('initDnD');
    // Add drag handling to target elements
    $('body').attr('id', 'body');
    document.getElementById('body').addEventListener('dragenter', onDragEnter, false);
    document.getElementById('drop-box-overlay').addEventListener('dragleave', onDragLeave, false);
    document.getElementById('drop-box-overlay').addEventListener('dragover', noopHandler, false);

    // Add drop handling
    document.getElementById('drop-box-overlay').addEventListener('drop', onDrop, false);
}

function noopHandler(evt) {
    console.log('noopHandler');
    evt.stopPropagation();
    evt.preventDefault();
}

function onDragEnter(evt) {
    console.log('onDragEnter');
    $('#drop-box-overlay').fadeIn(125);
    $('#drop-box-prompt').fadeIn(125);
}

function onDragLeave(evt) {
    console.log('onDragLeave');
    /*
     * We have to double-check the 'leave' event state because this event stupidly
     * gets fired by JavaScript when you mouse over the child of a parent element;
     * instead of firing a subsequent enter event for the child, JavaScript first
     * fires a LEAVE event for the parent then an ENTER event for the child even
     * though the mouse is still technically inside the parent bounds. If we trust
     * the dragenter/dragleave events as-delivered, it leads to "flickering" when
     * a child element (drop prompt) is hovered over as it becomes invisible,
     * then visible then invisible again as that continually triggers the enter/leave
     * events back to back. Instead, we use a 10px buffer around the window frame
     * to capture the mouse leaving the window manually instead. (using 1px didn't
     * work as the mouse can skip out of the window before hitting 1px with high
     * enough acceleration).
     */
    if (evt.pageX < 10 || evt.pageY < 10 || $(window).width() - evt.pageX < 10 || $(window).height() - evt.pageY < 10) {
        console.log('ondragleave');
        $('#drop-box-overlay').fadeOut(125);
        $('#drop-box-prompt').fadeOut(125);
    }
}

function onDrop(evt) {
    console.log('onDrop');
    // Consume the event.
    noopHandler(evt);

    $('#drop-box-overlay').fadeOut(0);
    // Get the dropped files.
    var files = evt.dataTransfer.files;
    // If anything is wrong with the dropped files, exit.
    if (typeof files == 'undefined' || files.length == 0) {
        return;
    }
    // Process each of the dropped files individually
    for (var i = 0, length = files.length; i < length; i++) {
        uploadFile(files[i], length);
    }
}

function uploadFile(file, totalFiles) {
    var reader = new FileReader();

    // Handle errors that might occur while reading the file (before upload).
    reader.onerror = function (evt) {
        var message;

        // REF: http://www.w3.org/TR/FileAPI/#ErrorDescriptions
        switch (evt.target.error.code) {
        case 1:
            message = file.name + ' not found.';
            break;

        case 2:
            message = file.name + ' has changed on disk, please re-try.';
            break;

        case 3:
            messsage = 'Upload cancelled.';
            break;

        case 4:
            message = 'Cannot read ' + file.name + '.';
            break;

        case 5:
            message = 'File too large for browser to upload.';
            break;
        }

        $('#upload-status-text').html(message);
    }

    // When the file is done loading, POST to the server.
    reader.onloadend = function (evt) {
        var data = evt.target.result;
        // Make sure the data loaded is long enough to represent a real file.
        if (data.length > 128) {
            // Per the Data URI spec, the only comma that appears is right after 'base64' and before the encoded content.
            var base64StartIndex = data.indexOf(',') + 1;
            // Make sure the index we've computed is valid, otherwise something is wrong and we need to forget this upload.
            if (base64StartIndex < data.length) {
                var img = new Image();
                img.onload = function () {
                    var w = this.width;
                    var h = this.height;
                    var img = data;

                    $.ajax({
                        type: 'GET',
                        url: 'http://repo.provisioner.net/merge_data.php?request=list',
                        dataType: 'text',
                        success: function (_data) {
                            var _data = {
                                'list_model': jQuery.parseJSON(_data),
                                'w': w,
                                'h': h,
                                'img': img
                            };

                            winkstart.publish('template.popup', {
                                data: _data
                            });
                        }
                    });
                };
                img.src = data;
            }
        }
    };

    // Start reading the image off disk into a Data URI format.
    reader.readAsDataURL(file);
}
