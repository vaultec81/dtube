Template.publish.rendered = function() {
  setTimeout(() => {
    Template.settingsdropdown.nightMode()
  },200)
  Template.publish.burnRange()
  var json = Session.get('tmpVideo').json
  if (json.title)
    $("#uploadTitle")[0].value = json.title
  if (json.desc)
    $("#uploadDescription")[0].value = json.desc

  if (!Session.get('tmpVideoEdit')) {
    if (json.dur)
      $("#inputDuration")[0].value = json.dur

    $('#tagDropdown').dropdown({
      allowAdditions: true
    })
    if (json.tag)
      $('#tagDropdown').dropdown('set selected', json.tag)

    var steemData = Session.get('tmpVideo').steem
    if (!steemData) return
    if (steemData && steemData.body)
      $("#inputSteemMarkdown")[0].value = steemData.body
    if (steemData && steemData.powerup == 1)
      $('#inputSteemPowerup').click()
  }

  $('#visibilityDropdown').dropdown({
    allowAdditions: false
  })
  if (json.hide)
    $('#visibilityDropdown').dropdown('set selected', json.hide)
  if (json.nsfw == 1)
    $('#inputNsfw').click()
  if (json.oc == 1)
    $('#inputOC').click()

}

Template.publish.events({
  'click #editVideo': function() {
    var json = Session.get('tmpVideo').json
    if (!json) {
      toastr.error('There is no content to publish')
      return
    }
    if (!json.title) {
      toastr.error(translate('UPLOAD_ERROR_TITLE_REQUIRED'), translate('ERROR_TITLE'))
      return
    }
    if (!json.title.length > 256) {
      toastr.error(translate('UPLOAD_ERROR_TITLE_TOO_LONG'), translate('ERROR_TITLE'))
      return
    }
    if (!json.tag || json.tag.indexOf(' ') > -1 || json.tag.indexOf(',') > -1 ) {
      toastr.error('Only a single tag is allowed', translate('ERROR_TITLE'))
      return
    }

    var steemData = Session.get('tmpVideo').steem
    var body = null
    if (steemData && steemData.body)
      body = steemData.body

      
    $("#editVideo").addClass('disabled')
    $("#editVideo i.podcast").addClass('dsp-non')
    $("#editVideo i.loading").removeClass('dsp-non')
    broadcast.multi.editComment(Session.get('currentRefs'),json,null,(err, res) => {
      $("#editVideo").removeClass('disabled')
      $("#editVideo i.loading").addClass('dsp-non')
      $("#editVideo i.podcast").removeClass('dsp-non')
      if (err) toastr.error("Error while broadcasting comment edit")
      else {
        toastr.success(translate('EDIT_VIDEO_SUCCESS'))
        var permlink = res[0]
        if (typeof permlink !== 'string')
          permlink = res[1]
        FlowRouter.go('/v/' + permlink)
        setTimeout(function() {
          Session.set('tmpVideo', {})
          Session.set('tmpVideoEdit', null)
          UserSettings.set('tmpVideo', {})
          Session.set('addVideoStep', 'addvideoform')
        }, 1000)
      }
    })
  },
  'click #publishVideo': function() {
    var json = Session.get('tmpVideo').json
    if (!json) {
      toastr.error('There is no content to publish')
      return
    }
    if (!json.title) {
      toastr.error(translate('UPLOAD_ERROR_TITLE_REQUIRED'), translate('ERROR_TITLE'))
      return
    }
    if (!json.title.length > 256) {
      toastr.error(translate('UPLOAD_ERROR_TITLE_TOO_LONG'), translate('ERROR_TITLE'))
      return
    }
    if (!json.tag || json.tag.indexOf(' ') > -1 || json.tag.indexOf(',') > -1 ) {
      toastr.error('Only a single tag is allowed', translate('ERROR_TITLE'))
      return
    }
    if (!Template.publish.__helpers[" hasThumbnail"]()) {
      toastr.error(translate('UPLOAD_ERROR_UPLOAD_SNAP_FILE'), translate('ERROR_TITLE'))
      return
    }

    var steemData = Session.get('tmpVideo').steem
    var body = null
    if (steemData && steemData.body)
      body = steemData.body

    var burn = parseInt(Session.get('publishBurn'))
    $("#publishVideo").addClass('disabled')
    $("#publishVideo i.podcast").addClass('dsp-non')
    $("#publishVideo i.loading").removeClass('dsp-non')

    if (burn > 0) {
      broadcast.multi.comment(null, null, null, null, null, null, body, json, json.tag, burn, function(err, res) {
        console.log(err, res)
        $("#publishVideo").removeClass('disabled')
        $("#publishVideo i.loading").addClass('dsp-non')
        $("#publishVideo i.podcast").removeClass('dsp-non')
        if (err) toastr.error(Meteor.blockchainError(err))
        else {
          FlowRouter.go('/v/' + res[0])
          Session.set('tmpVideo', {})
          UserSettings.set('tmpVideo', {})
          Session.set('addVideoStep', 'addvideoform')
        }
      })
    } else {
      broadcast.multi.comment(null, null, null, null, null, null, null, json, json.tag, null, function(err, res) {
        console.log(err, res)
        $("#publishVideo").removeClass('disabled')
        $("#publishVideo i.loading").addClass('dsp-non')
        $("#publishVideo i.podcast").removeClass('dsp-non')
        if (err) toastr.error(Meteor.blockchainError(err))
        else {
          FlowRouter.go('/v/' + res[0])
          setTimeout(function() {
            Session.set('tmpVideo', {})
            UserSettings.set('tmpVideo', {})
            Session.set('addVideoStep', 'addvideoform')
          }, 1000)
        }
      })
    }
  },
  'click #trashVideo': function() {
    Session.set('addVideoStep', 'addvideoform')
    Session.set('tmpVideo', {})
    UserSettings.set('tmpVideo', {})
  },
  'change #uploadTitle, change #uploadDescription, change #tagDropdown, change #visibilityDropdown, change #inputNsfw, change #inputOC, change #inputDuration': function() {
    var tmpVideo = Session.get('tmpVideo')
    tmpVideo.json.title = $('#uploadTitle')[0].value
    tmpVideo.json.desc = $('#uploadDescription')[0].value
    if (!Session.get('tmpVideoEdit')) {
      tmpVideo.json.tag = $('#tagDropdown')[0].value
      tmpVideo.json.dur = $('#inputDuration')[0].value
    }

    tmpVideo.json.hide = parseInt($('#visibilityDropdown')[0].value)
    if ($('#inputNsfw')[0].checked)
      tmpVideo.json.nsfw = 1
    else
      tmpVideo.json.nsfw = 0
    if ($('#inputOC')[0].checked)
      tmpVideo.json.oc = 1
    else
      tmpVideo.json.oc = 0
    Session.set('tmpVideo', tmpVideo)
    UserSettings.set('tmpVideo', tmpVideo)
  },
  'change #inputSteemMarkdown, change #inputSteemPowerup': function() {
    var tmpVideo = Session.get('tmpVideo')
    if (!tmpVideo.steem) tmpVideo.steem = {}
    tmpVideo.steem.body = $('#inputSteemMarkdown')[0].value
    if ($('#inputSteemPowerup')[0].checked)
      tmpVideo.steem.powerup = 1
    else
      tmpVideo.steem.powerup = 0
    Session.set('tmpVideo', tmpVideo)
    UserSettings.set('tmpVideo', tmpVideo)
  },
  'change #snapFile': function (event) {
    var file = event.currentTarget.files[0];
    var ValidImageTypes = ["image/gif", "image/jpeg", "image/png"];
    if (file.type.split('/')[0] != 'image') {
      toastr.error(translate('UPLOAD_ERROR_NOT_IMAGE'), translate('ERROR_TITLE'))
      return
    }
    if (file.size > Session.get('remoteSettings').snapMaxFileSizeKB * 1000) {
      toastr.error(translate('UPLOAD_ERROR_REACH_MAX_SIZE') + ' ' + Session.get('remoteSettings').snapMaxFileSizeKB + ' KB', translate('ERROR_TITLE'))
      return
    }


    // uploading to ipfs
    if (Session.get('ipfsUpload')) node = Session.get('ipfsUpload')
    Template.upload.uploadImage(file, '#progresssnap', function (err, smallHash, bigHash) {
      if (err) {
        console.log(err)
        toastr.error(err, translate('UPLOAD_ERROR_IPFS_UPLOADING'))
        return
      } else {
        console.log('Uploaded Snap', smallHash, bigHash)
        var tmpVideo = Session.get('tmpVideo')
        var files = tmpVideo.json.files
        if (!files.ipfs) files.ipfs = {}
        if (!files.ipfs.img) files.ipfs.img = {}
        files.ipfs.img["118"] = smallHash
        files.ipfs.img["360"] = bigHash
        tmpVideo.files = files
        Session.set('tmpVideo', tmpVideo)
        UserSettings.set('tmpVideo', tmpVideo)
        Template.player.reset()
      }
    })
  },
  "click #addVideo": function() {
    Session.set('addVideoStep', 'addvideoform')
  },
  'click #addSubtitle': function (event) {
      Session.set('addVideoStep', 'addsubtitle')
  },
  "click .edit-file": function() {
    if (this.tech == 'Skynet')
      Session.set('addVideoStep', 'addvideoformp2psia')
    else
      Session.set('addVideoStep', 'addvideoformp2p'+this.tech.toLowerCase())
  },
  "click .trash-file": function() {
    var tmpVideo = Session.get('tmpVideo')
    console.log(this)
    if (isDecentralized(this.tech))
      delete tmpVideo.json.files[this.tec][this.type][this.ver]
    else
      delete tmpVideo.json.files[this.tech]
    Session.set('tmpVideo', tmpVideo)
    UserSettings.set('tmpVideo', tmpVideo)
  },
  "click .preview-file": function() {
    if (this.tech == 'Skynet') {
      window.open("https://siasky.net/"+this.hash)
      return
    }
    var gw = this.gw
    if (!gw) {
      if (this.tech == 'BTFS')
        if (this.type== 'img' && this.ver == 'spr')
          gw = 'sprite.d.tube'
        else if (this.type == 'img' )
          gw = 'snap1.d.tube'
        else
          gw = 'player.d.tube'
      if (this.tech == 'IPFS')
        if (this.type== 'img' && this.ver == 'spr')
          gw = 'ipfs.io'
        else if (this.type == 'img' || this.type == 'sub')
          gw = 'snap1.d.tube'
        else
          gw = 'ipfs.io'
    }

    window.open("https://"+gw+"/"+this.tech.toLowerCase()+"/"+this.hash);
  }
})

Template.publish.helpers({
    tmpVideo: function () {
      return Session.get('tmpVideo')
    },
    isEditingVideo: function() {
      if (Session.get('tmpVideoEdit'))
        return true
      return false
    },
    activeUsernameSteem: function() {
      return Session.get('activeUsernameSteem')
    },
    hasThumbnail: function() {
      var json = Session.get('tmpVideo').json
      if (json.thumbnailUrl)
        return true
      var files = json.files
      if (files["youtube"]) return true
      if (files.btfs && files.btfs.img && files.btfs.img["118"]) return true
      if (files.btfs && files.btfs.img && files.btfs.img["360"]) return true
      if (files.ipfs && files.ipfs.img && files.ipfs.img["118"]) return true
      if (files.ipfs && files.ipfs.img && files.ipfs.img["360"]) return true
      if (files.sia && files.sia.img && files.sia.img["118"]) return true
      if (files.sia && files.sia.img && files.sia.img["360"]) return true
      return false
    },
    hasVideo: function() {
      var files = Session.get('tmpVideo').json.files
      var prov3p = Providers.all3p()
      for (let i = 0; i < prov3p.length; i++)
        if (files[prov3p[i].id]) return true
      if (files["youtube"]) return true
      if (files.btfs && files.btfs.vid && files.btfs.vid["src"]) return true
      if (files.ipfs && files.ipfs.vid && files.ipfs.vid["src"]) return true
      if (files.sia && files.sia.vid && files.sia.vid["src"]) return true
      return false
    },
    hasDecentralizedVideo: function() {
      var files = Session.get('tmpVideo').json.files
      if (files.btfs && files.btfs.vid && files.btfs.vid["src"]) return true
      if (files.ipfs && files.ipfs.vid && files.ipfs.vid["src"]) return true
      if (files.sia && files.sia.vid && files.sia.vid["src"]) return true
      return false
    },
    files: function() {
      var files = Session.get('tmpVideo').json.files
      var filesList = []
      for (const tech in files) {
        if (tech == 'btfs' || tech == 'ipfs') {
          var gw = null
          for (const type in files[tech]) {
            if (type == 'gw') {
              gw = files[tech][type]
              delete files[tech][type]
              break
            }
          }
          for (const type in files[tech]) {
            for (const ver in files[tech][type]) {
              filesList.push({
                tec: tech,
                tech: tech.toUpperCase(),
                type: type,
                ver: ver,
                hash: files[tech][type][ver],
                gw: gw
              })
            }
          }
          continue
        }
        if (tech == 'sia') {
          for (const type in files[tech]) {
            for (const ver in files[tech][type]) {
              filesList.push({
                tec: tech,
                tech: 'Skynet',
                type: type,
                ver: ver,
                hash: files[tech][type][ver],
                gw: gw
              })
            }
          }
          continue
        }
        filesList.push({
          tech: tech,
          type: '3p',
          hash: files[tech]
        })
      }
      return filesList
    },
    prettyType: function(type, version) {
      if (type == '3p') return translate("UPLOAD_FILE_3RDPARTY")
      switch (type) {
        case 'vid':
          switch (version) {
            case 'src':
              return 'Source Video'
              break;

            case '240':
              return '240p Video'
              break;

            case '480':
              return '480p Video'
              break;

            case '720':
              return '720p Video'
              break;

            case '1080':
              return '1080p Video'
              break;
          
            default:
              return 'Unknown Video Quality'
              break;
          }
          break;

        case 'img':
          switch (version) {
            case 'spr':
              return 'Sprite Image'
              break;

            case '118':
              return '210x118 Thumbnail'
              break;

            case '360':
              return '640x360 Thumbnail'
              break;
          
            default:
              return 'Unknown Image'
              break;
          }
          break;

        case 'sub':
          return version+ ' Subtitle'
          break;

        default:
          return "Unknown File Type"
          break;
      }
    },
    isDecentralized: function(tech) {
      return isDecentralized(tech)
    },
    publishBurn: function () {
      return Session.get('publishBurn')
    }
})

Template.publish.burnRange = function(cb) {
  if (!Session.get('activeUsername')) {
    if (cb) cb()
    return
  }
    
  var balance = Users.findOne({username: Session.get('activeUsername'), network: 'avalon'}).balance
  var step = Math.pow(10, balance.toString().length - 1)/100
  if (step<1) step = 1
  setTimeout(function() {
    $('#burn-range').range({
      min: 0,
      max: 100,
      start: Session.get('publishBurn'),
      onChange: function(val) { 
        Session.set('publishBurn', logSlider(parseInt(val), balance))
      }
    });
    if (cb) cb()
  }, 100)
}

Template.publish.generateVideo = function() {
  var article = {
    videoId: $('input[name=videohash]')[0].value,
    duration: parseFloat($('input[name=duration]')[0].value),
    title: $('input[name=title]')[0].value,
    description: $('textarea[name=description]')[0].value,
    filesize: parseInt($('input[name=filesize]')[0].value),
    ipfs: {
      snaphash: $('input[name=snaphash]')[0].value,
      spritehash: $('input[name=spritehash]')[0].value,
      videohash: $('input[name=videohash]')[0].value
    }
  }

  if ($('input[name=video240hash]')[0].value.length > 0)
    article.ipfs.video240hash = $('input[name=video240hash]')[0].value
  if ($('input[name=video480hash]')[0].value.length > 0)
    article.ipfs.video480hash = $('input[name=video480hash]')[0].value
  if ($('input[name=video720hash]')[0].value.length > 0)
    article.ipfs.video720hash = $('input[name=video720hash]')[0].value
  if ($('input[name=video1080hash]')[0].value.length > 0)
    article.ipfs.video1080hash = $('input[name=video1080hash]')[0].value
  if ($('input[name=magnet]')[0].value.length > 0)
    article.magnet = $('input[name=magnet]')[0].value

  if (Session.get('tempSubtitles') && Session.get('tempSubtitles').length > 0)
    article.ipfs.subtitles = Session.get('tempSubtitles')

  if (article.ipfs.snaphash) {
    article.thumbnailUrl = 'https://snap1.d.tube/ipfs/'+article.ipfs.snaphash
  }

  if (!article.title) {
    toastr.error(translate('UPLOAD_ERROR_TITLE_REQUIRED'), translate('ERROR_TITLE'))
    return
  }
  if (!article.title.length > 256) {
    toastr.error(translate('UPLOAD_ERROR_TITLE_TOO_LONG'), translate('ERROR_TITLE'))
    return
  }
  if (!article.ipfs.snaphash || !article.thumbnailUrl) {
    toastr.error(translate('UPLOAD_ERROR_UPLOAD_SNAP_FILE'), translate('ERROR_TITLE'))
    return
  }
  if (!article.ipfs.videohash || !article.videoId) {
    toastr.error(translate('UPLOAD_ERROR_UPLOAD_VIDEO_BEFORE_SUBMITTING'), translate('ERROR_TITLE'))
    return
  } else {
    article.providerName = 'BTFS'
  }
  return article
}

Template.publish.createPermlink = function(video) {
  if (!video) return
  if (!video.files) return
  if (video.files.btfs && video.files.btfs.vid && video.files.btfs.vid.src)
    return video.files.btfs.vid.src
  if (video.files.ipfs && video.files.ipfs.vid && video.files.ipfs.vid.src)
    return video.files.ipfs.vid.src
  if (video.files.sia && video.files.sia.vid && video.files.sia.vid.src)
    return video.files.sia.vid.src

  // todo add 3rd party videoIds
  return Template.publish.randomPermlink(11)
}

Template.publish.randomPermlink = function(length) {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function isDecentralized(tech) {
  if (tech == 'BTFS') return true
  if (tech == 'IPFS') return true
  if (tech == 'Skynet') return true
  return false
}

function logSlider(position, maxburn) {
  if (position == 0) return 0
  // position will be between 0 and 100
  var minp = 0;
  var maxp = 100;

  // The result should be between 1 and maxburn
  var minv = 0;
  var maxv = Math.log(maxburn);

  // calculate adjustment factor
  var scale = (maxv-minv) / (maxp-minp);

  return Math.round(Math.exp(minv + scale*(position-minp)))
}