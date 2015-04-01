/**
 * Created by petitspois on 3/31/15.
 */

define(['jquery', 'WebUploader', 'bsm'], function($, WebUploader){



    var toolbar = Editor.toolbar;

    var replaceTool = function(name, callback){
        for(var i=0, len=toolbar.length; i<len; i++){
            var v = toolbar[i];
            if(typeof(v) !== 'string' && v.name === name){
                v.action = callback;
                break;
            }
        }
    };

    var $body = $('body');

    //添加连接工具
    var ToolLink = function(){
        var self = this;
        this.$win = $([
            '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="editorToolImageTitle" aria-hidden="true">',
            '<div class="modal-header">',
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
            '<h3 id="editorToolImageTitle">添加连接</h3>',
            '</div>',
            '<div class="modal-body">',
            '<form class="form-horizontal">',
            '<div class="control-group">',
            '<label class="control-label">标题</label>',
            '<div class="controls">',
            '<input type="text" name="title" class="form-control" placeholder="Title">',
            '</div>',
            '</div>',
            '<div class="control-group">',
            '<label class="control-label">连接</label>',
            '<div class="controls">',
            '<input type="text" name="link" class="form-control" value="http://" placeholder="Link">',
            '</div>',
            '</div>',
            '</form>',
            '</div>',
            '<div class="modal-footer">',
            '<button class="btn btn-primary" role="save">确定</button>',
            '</div>',
            '</div>'
        ].join('')).appendTo($body);

        this.$win.on('click', '[role=save]', function(){
            self.$win.find('form').submit();
        }).on('submit', 'form', function(){
            var $el = $(this);
            var title = $el.find('[name=title]').val();
            var link = $el.find('[name=link]').val();

            self.$win.modal('hide');
            self.editor.push(' ['+ title +']('+ link +')');

            $el.find('[name=title]').val('');
            $el.find('[name=link]').val('http://');

            return false;
        });
    };

    ToolLink.prototype.bind = function(editor){
        this.editor = editor;
        this.$win.modal('show');
    };

    //图片上传工具
    var ToolImage = function(){
        var self = this;
        this.$win = $([
            '<div class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="editorToolImageTitle" aria-hidden="true">',
            '<div class="modal-header">',
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
            '<h3 id="editorToolImageTitle">图片</h3>',
            '</div>',
            '<div class="modal-body">',
            '<div class="upload-img">',
            '<div class="button btn btn-primary btn-addon btn-lg"><i class="fa fa-plus"></i>上传图片</div>',
            '<span class="tip"></span>',
            '<div class="alert alert-error hide"></div>',
            '</div>',
            '</div>',
            '</div>'
        ].join('')).appendTo($body);

        this.$upload = this.$win.find('.upload-img').css({
            padding: '60px 0',
            textAlign: 'center',
            border: '1px dashed#ddd'
        });

        this.$uploadBtn = this.$upload.find('.button').css({
            position:'relative',
            margin: '0 auto'
        });

        this.$uploadTip = this.$upload.find('.tip').hide();

        this.file = false;

        this.uploader = WebUploader.create({
            server: '/qnupload',
            pick: this.$uploadBtn[0],
            auto: true,
            fileSingleSizeLimit: 2 * 1024 * 1024,
            //sendAsBinary: true,
            // 只允许选择图片文件。
            accept: {
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }
        });

        this.uploader.on('beforeFileQueued', function(file){
            if(self.file !== false || !self.editor){
                return false;
            }
            self.showFile(file);
        });

        this.uploader.on('uploadProgress', function(file, percentage){
            // console.log(percentage);
            self.showProgress(file, percentage * 100);
        });

        this.uploader.on('uploadSuccess', function(file, res){
            if(res.success){
                self.$win.modal('hide');
                self.editor.push(' !['+ file.name +']('+ res.url +')');
            }
            else{
                self.removeFile();
                self.showError(res.msg || '服务器走神了，上传失败');
            }
        });

        this.uploader.on('uploadComplete', function(file){
            self.uploader.removeFile(file);
            self.removeFile();
        });

        this.uploader.on('error', function(type){
            self.removeFile();
            switch(type){
                case 'Q_EXCEED_SIZE_LIMIT':
                case 'F_EXCEED_SIZE':
                    self.showError('文件太大了, 不能超过2M');
                    break;
                case 'Q_TYPE_DENIED':
                    self.showError('只能上传图片');
                    break;
                default:
                    self.showError('发生未知错误');
            }
        });

        this.uploader.on('uploadError', function(){
            self.removeFile();
            self.showError('服务器走神了，上传失败');
        });
    };

    ToolImage.prototype.removeFile = function(){
        //var self = this;
        this.file = false;
        this.$uploadBtn.show();
        this.$uploadTip.hide();
    };

    ToolImage.prototype.showFile = function(file){
        //var self = this;
        this.file = file;
        this.$uploadBtn.hide();
        this.$uploadTip.html('正在上传: ' + file.name).show();
        this.hideError();
    };

    ToolImage.prototype.showError = function(error){
        this.$upload.find('.alert-error').html(error).show();
    };

    ToolImage.prototype.hideError = function(error){
        this.$upload.find('.alert-error').hide();
    };

    ToolImage.prototype.showProgress = function(file, percentage){
        this.$uploadTip
            .html('正在上传: ' + file.name + ' ' + percentage + '%')
            .show();
    };

    ToolImage.prototype.bind = function(editor){
        this.editor = editor;
        this.$win.modal('show');
    };

    var toolImage = new ToolImage();
    var toolLink = new ToolLink();

    replaceTool('picture-o', function(editor){
        toolImage.bind(editor);
    });
    replaceTool('link', function(editor){
        toolLink.bind(editor);
    });

    //当编辑器取得焦点时，绑定 toolImage；
    var createToolbar = Editor.prototype.createToolbar;
    Editor.prototype.createToolbar = function(items){
        createToolbar.call(this, items);
        var self = this;
        $(self.codemirror.display.input).on('focus', function(){
            toolImage.editor = self;
        });
    };

    //追加内容
    Editor.prototype.push = function(txt){
        var cm = this.codemirror;
        var line = cm.lastLine();
        cm.setLine(line, cm.getLine(line) + txt);
    };


});