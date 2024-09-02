# What is that?
![Main Screen](img/rrm2x.png)
RRManager is a Redpill Recovery DSM application aimed to provide the ability to configure/update RR without booting to RR recovery. This package is for experienced users.

# RRM + TTYD + Download Station = ❤️

❗❗❗ Required `RR v.24.2.4`

### Features
 - [x] Update RR (From `PC` and `DSM`)
 - [x] Managing addons
 - [x] Update manager: update checker and downloader via `Download Manager` 

### TODO
 - [ ] Seemles integration with `TTYD` Package (in progress)
 - [ ] Fix the issue during installing the RRM alongside with `WebStation`
 - [ ] Localization 

That app is built on the `DSM` UI framework: `Ext.Js 3.4`.
I didn't find documentaion regarding that framework, so I spent a lot of time to reserch how to build ui and call DSM actions utilyzing that approach. That is why the ui is so unperfect))

# Instalation
1. Download RR Manager spk file from github
2. Install SPK, specify the path to store RR artifacts
3. Follow the guide to create necessary resources

## How does it work?
During the app install, you can specify the folders to store the RR artifacts during the update process. You can also select the folders and shares created during the installation or populate existing shares.

In my case the share is `rr` and the temp folder is `tmp`.

Please note that you need to upload `updateX.zip(updateall-24.3.0)`, not `rr-23.11.1.img.zip`.
I will add that validation in the future.
