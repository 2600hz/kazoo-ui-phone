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
        'phone.render_fields': 'render_fields',
        'phone_admin.activate': 'activate'
    },

    resources: {
        'phone.update_local_template': {
            url: '{api_url}/accounts/{account_id}/local_provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'POST'
        },
        'phone.delete_local_template': {
            url: '{api_url}/accounts/{account_id}/local_provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'DELETE'
        },
        'phone.create_local_template': {
           url: '{api_url}/accounts/{account_id}/local_provisioner_templates',
           contentType: 'application/json',
           verb: 'PUT'
        },
        'phone.create_local_template_image': {
            url: '{api_url}/accounts/{account_id}/local_provisioner_templates/{phone_id}/image',
            contentType: 'application/x-base64',
            verb: 'POST'
        },
        'phone.get_local_template_image': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates/{phone_id}/image',
            contentType: 'application/json',
            verb: 'GET'
        },
        'phone.get_local_template': {
            url: '{api_url}/accounts/{account_id}/local_provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'GET'
        },
        'phone.list_local_template': {
            url: '{api_url}/accounts/{account_id}/local_provisioner_templates',
            contentType: 'application/json',
            verb: 'GET'
        },
        /* GLOBAL */
        'phone.update_global_template': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'POST'
        },
        'phone.delete_global_template': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'DELETE'
        },
        'phone.create_global_template': {
           url: '{api_url}/accounts/{account_id}/global_provisioner_templates',
            contentType: 'application/json',
            verb: 'PUT'
        },
        'phone.get_global_template_image': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates/{phone_id}/image',
            contentType: 'application/json',
            verb: 'GET'
        },
        'phone.create_global_template_image': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates/{phone_id}/image',
            contentType: 'application/x-base64',
            verb: 'POST'
        },
        'phone.get_global_template': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates/{phone_id}',
            contentType: 'application/json',
            verb: 'GET'
        },
        'phone.list_global_template': {
            url: '{api_url}/accounts/{account_id}/global_provisioner_templates',
            contentType: 'application/json',
            verb: 'GET'
        }
    }
}, function (args) {
    winkstart.registerResources(this.__whapp, this.config.resources);

    if('ui_flags' in winkstart.apps.voip && winkstart.apps.voip.ui_flags.provision_admin) {
        //Dirty hack to get provisioner admin to show up as a whapp
        winkstart.apps['phone_admin'] = {
            label: 'Provisioner',
            icon: 'connectivity',
            api_url: winkstart.apps['voip'].api_url,
            account_id: winkstart.apps['voip'].account_id,
            is_masqueradable: true
        };
        winkstart.publish('whappnav.add', {
            name: 'phone_admin'
        });
    }
},

{
    save_phone: function(phone_data, args) {
        var thisPhone = phone_data;
        thisPhone.type = thisPhone.type ? thisPhone.type : 'local';
        if(thisPhone.id) {
            if(args.img) {
                winkstart.request('phone.update_' + thisPhone.type + '_template', {
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
                delete post_data.image.base64;
                winkstart.request('phone.update_' + post_data.type + '_template', {
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
            var image_data = thisPhone.image.base64;
            delete thisPhone.image.base64;
            winkstart.request('phone.create_' + thisPhone.type + '_template', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url,
                    data: thisPhone
                },
                function (data, status) {
                    winkstart.request('phone.create_' + thisPhone.type + '_template_image', {
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            phone_id: data.data.id,
                            data: image_data
                        },
                        function(_data, status) {
                            winkstart.publish('phone.edit', { id: data.data.id, type: data.data.type });
                            winkstart.publish('phone.list');
                        }
                    );
                }
            );
        }
    },

    render_fields: function(parent, provision_data, callback) {
        var THIS = this,
            fields_html;

        var data = {
            field_data: {
                brands: {
                    'yealink': {
                        families: {
                            't3x': {},
                            't2x': {},
                            't1x': {}
                        }
                    },
                    'polycom': {
                        families: {
                            'p111': {},
                            'p222': {},
                            'p333': {}
                        }
                    }
                }
            }
        };

        fields_html = THIS.templates.fields.tmpl(data);

        $('.dropdown_family', fields_html).hide();
        $('#dropdown_brand', fields_html).change(function() {
            $('.dropdown_family', fields_html).hide();
            $('.dropdown_family[data-brand="'+$(this).val()+'"]', fields_html).show();
        });

        (parent)
            .empty()
            .append(fields_html);

        if(typeof callback == 'function') {
            callback();
        }

        /* Nice hack for amplify.publish */
        return false;
    },

    edit_popup: function (args) {
        var THIS = this;

        winkstart.request('phone.get_'+args.provision_type+'_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url,
                phone_id: args.id
            },
            function(_data, status) {
                var A = $.extend(true, {}, _data.data);
                var B = $.extend(true, {}, args.data);
                B.template = B.overrides;
                var C = $.extend(true, {}, A, B);

                A.template = C.template;
                B.template = C.template;

                A.search = C.search;
                B.search = C.search;

                var popup, popup_html;

                popup_html = $('<div class="inline_popup" style="padding-top:10px"><div class="inline_content"/></div>');

                A.image.base64 = winkstart.apps.voip.api_url +'/accounts/'+ winkstart.apps.voip.account_id + '/' + A.type + '_provisioner_templates/'+A.id+'/image?auth_token='+winkstart.apps.voip.auth_token;

                $('.inline_content', popup_html).html(THIS.templates.phonePopup.tmpl({
                    data: A
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
                    $.extend(args.data, THIS.crazy_clean(B));
                    args.data.overrides = args.data.template;
                    delete args.data.template;

                    dialog.dialog('destroy').remove();
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
        args.type = args.type ? args.type : 'local';
        winkstart.request('phone.get_' + args.type + '_template', {
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url,
                phone_id: args.id
            },
            function(_data, status) {
                var A = _data.data;
                A.type = args.type;

                var form_data = {
                    'data': A
                };

                form_data.data.image.base64 = winkstart.apps.voip.api_url +'/accounts/'+ winkstart.apps.voip.account_id + '/' + A.type + '_provisioner_templates/'+A.id+'/image?auth_token='+winkstart.apps.voip.auth_token;

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
                        id: args.id,
                        type: args.type || 'local'
                    });
                });

                $('.phone-update').click(function() {
                    A.name = $('#template_description', '#main').val();
                    winkstart.publish('phone.save', A, { img: false });
                });
            }
        );

        $('#phone-view').empty();
    },

    delete_phone: function (args) {
        args.type = args.type ? args.type : 'local';
        winkstart.request('phone.delete_' + args.type + '_template', {
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

    render_list: function() {
        var THIS = this,
            setup_list = function (local_data, global_data) {
                var templates;
                function map_crossbar_data(crossbar_data, type){
                    var new_list = [];
                    if(crossbar_data.length > 0) {
                        _.each(crossbar_data, function(elem){
                            new_list.push({
                                id: elem.id,
                                title: elem.name,
                                type: type
                            });
                        });
                    }

                    return new_list;
                }

                var options = {};
                options.label = 'Phone Module';
                options.identifier = 'phone-module-listview';
                options.new_entity_label = 'phone';

                templates = [].concat(map_crossbar_data(local_data, 'local'), map_crossbar_data(global_data, 'global'));
                templates.sort(function(a, b) {
                    var answer;
                    a.title.toLowerCase() < b.title.toLowerCase() ? answer = -1 : answer = 1;
                    return answer;
                });

                options.data = templates;
                options.publisher = winkstart.publish;
                options.notifyMethod = 'phone.edit';
                options.notifyCreateMethod = 'phone.create';

                $('#phone-listpanel').empty();
                $('#phone-listpanel').listpanel(options);
            };

        if(!('ui_flags' in winkstart.apps['voip']) || !('super_duper_admin' in winkstart.apps.voip['ui_flags']) || winkstart.apps.voip.ui_flags.super_duper_admin === false) {
            THIS.list_local_templates(function(local_data) {
                setup_list(local_data.data, []);
            });
        }
        else {
            THIS.list_global_templates(function(global_data) {
                THIS.list_local_templates(function(local_data) {
                    setup_list(local_data.data, global_data.data);
                });
            });
        }
    },

    list_local_templates: function(callback) {
        winkstart.getJSON('phone.list_local_template', {
                crossbar: true,
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url
            },
            function(data, status) {
                if(typeof callback == 'function') {
                    callback(data);
                }
            }
        );
    },

    list_global_templates: function(callback) {
        winkstart.getJSON('phone.list_global_template', {
                crossbar: true,
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url
            },
            function(data, status) {
                if(typeof callback == 'function') {
                    callback(data);
                }
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
            popup = winkstart.dialog(add_template_html, {
                width: '420px',
                modal: true,
                resizable: false,
                title: 'Add new template'
            });

        $('#add_new_template', add_template_html).click(function() {
            var val = $('.model_select:visible', add_template_html).first().val().split('_'); //brand_product_model
            var form_data = {
                name: $('#template_name', add_template_html).val(),
                type: $('#template_type', add_template_html).val() || 'local'
            };
            addTemplate(w, h, img, val[2], val[1], val[0], form_data);

            popup.dialog('destroy').remove();
        });

        $('#cancel', add_template_html).click(function() {
            popup.dialog('destroy').remove();
        });

        var brand = 'yealink'; // initialization_value
        $('#brand', add_template_html).val(brand);
        $('.model_select', add_template_html).hide();
        $('#model_select_'+brand, add_template_html).show();

        $('#brand', add_template_html).bind('change keyup', function () {
            brand = $(this).val();
            $('.model_select', add_template_html).hide();
            $('#model_select_'+brand, add_template_html).show();
        });
    },

    activate: function (data) {
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

        var diag_id = 'dialog_' + id,
            search_box_id = 'search-box_' + id,
            search_id = 'search-container-' + id,
            title = (phone_data.settings.button_boxes[id].title ? phone_data.settings.button_boxes[id].title : ''),
            editable = phone_data.settings.button_boxes[id].editable,
            htmlChecked = editable ? 'checked="CHECKED"' : '';

        $('body').append("<div id='" + diag_id + "' style='display:none'><div id='" + diag_id + "-options'></div>");

        if (admin) {
            $('#' + diag_id).prepend("<div><fieldset class='provisioner admin'><legend>Admin Area</legend>" + "<div>Title:&nbsp; <input type='text' id='box_title' class='fancy' style='width:300px;' value='" + title + "' /></div>" + "<div>Check this if you want to allow the user to edit this box. <input type='checkbox' id='editable_checkbox'" + htmlChecked + "/></div>" + "<div>Filter: <input type='text' id='" + search_box_id + "' class='fancy' style='width:300px;' /></div>" + "<div><div class='padding-top:10px;' id='" + search_id + "'>" + diag_search + "</div></div></fieldset><div style='clear:both;'/></div>" + "<hr style='clear:both;'/></div></div>");

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

        temp_content = "<form id='" + diag_id + "-formdata' class='fields_wrapper' onsubmit='return false;'>" + temp_content + "</form>";
        $('#' + diag_id + '-options').html(temp_content);

        var btns = {
            'OK': function () {
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
                winkstart.confirm('Are you sure you want to delete this box?', function() {
                        $(box).fadeOut(400);
                        var vars = phone_data.settings.button_boxes[id].vars;
                        for (var key in vars) {
                            unsetUsedSearch(id, key, phone_data);
                        }
                        delete phone_data.settings.button_boxes[id];
                        if(!set_default) {
                            deleteConfig(diag_id, phone_data);
                        }
                        popup_hot_spot.dialog('destroy').remove();
                    }
                );
            }
        };

        if(!admin) {
            delete btns.Delete;
        }

        var popup_hot_spot = $('#' + diag_id).dialog({
            width: 'auto',
            zIndex: 20000,
            modal: true,
            title: 'Edit Hot Spot',
            buttons: btns,
            close: function (event, ui) {
                $(this).dialog('destroy').remove();
            }
        });

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

                $(makeInput(obj, loop, keyRead(key), id, key, cat, sec, admin)).hide().prependTo('#' + diag_id).slideDown('slow');

                initDialogTrash();

                $('#search-container-' + id).masonry('remove', $(this)).masonry('reload');
            });
        }
    });
}

function keyRead(key) {
    key_read = key.substring(key.indexOf('|') + 1, key.length);
    key_read = ucwords(key_read.replace(/_/g, ' '));
    return key_read;
}

function initDialogTrash() {
    $('.provisioner-remove').button({
        icons: {
            primary: 'ui-icon-trash'
        },
        text: false
    });
}

//This function generates the buttons, clickable and searchable
function searchTerms(term, id, phone_data) {
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
    phone_data.search.used_items[key] = true;
    phone_data.settings.button_boxes[id].vars[key] = true;
}

function unsetUsedSearch(id, key, phone_data) {
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
    var id = (event.target.id).split('_')[1];
    phone_data.settings.button_boxes[id].w = event.target.clientWidth;
    phone_data.settings.button_boxes[id].h = event.target.clientHeight;
}

function moveResizable(event, phone_data) { //write to db
    var id = (event.target.id).split('_')[1];
    phone_data.settings.button_boxes[id].x = event.target.offsetLeft;
    phone_data.settings.button_boxes[id].y = event.target.offsetTop;
}

function addResizable(event, phone_data, admin, set_default) {
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

function addTemplate(w, h, img, mdl, prdt, brnd, form_data) {
    $('#photo').css('width', w)
               .css('height', h)
               .css('background-image', 'url(' + img + ')');
    $('.resizable').remove();

    var phone_data = {
        name: form_data.name,
        type: form_data.type,
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

// lets do some awesome drag and drop stuff!
function initDnD() {
    // Add drag handling to target elements
    $('body').attr('id', 'body');
    document.getElementById('body').addEventListener('dragenter', onDragEnter, false);
    document.getElementById('drop-box-overlay').addEventListener('dragleave', onDragLeave, false);
    document.getElementById('drop-box-overlay').addEventListener('dragover', noopHandler, false);

    // Add drop handling
    document.getElementById('drop-box-overlay').addEventListener('drop', onDrop, false);
}

function noopHandler(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}

function onDragEnter(evt) {
    $('#drop-box-overlay').fadeIn(125);
    $('#drop-box-prompt').fadeIn(125);
}

function onDragLeave(evt) {
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
        $('#drop-box-overlay').fadeOut(125);
        $('#drop-box-prompt').fadeOut(125);
    }
}

function onDrop(evt) {
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
                                'img': img,/*
                                'type': file.type*/
                            };

                            if(!('ui_flags' in winkstart.apps['voip']) || !('super_duper_admin' in winkstart.apps.voip['ui_flags']) || winkstart.apps.voip.ui_flags.super_duper_admin === false) {
                                _data.type = 'local';
                            }

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
