package models

type FileType int

const (
	FileTypeMKV FileType = iota
	FileTypeMP4
	FileTypeAVI
	FileTypeMOV
	FileTypeWMV
	FileTypeFLV
	FileTypeWEBM
	FileTypeGIF
	FileTypeM4V
	FileTypeMPG
	FileTypeMPEG
	FileType3GP
	FileTypeOGV
)

var SupportedExtensions = map[FileType]string{
	FileTypeMKV:  ".mkv",
	FileTypeMP4:  ".mp4",
	FileTypeAVI:  ".avi",
	FileTypeMOV:  ".mov",
	FileTypeWMV:  ".wmv",
	FileTypeFLV:  ".flv",
	FileTypeWEBM: ".webm",
	FileTypeGIF:  ".gif",
	FileTypeM4V:  ".m4v",
	FileTypeMPG:  ".mpg",
	FileTypeMPEG: ".mpeg",
	FileType3GP:  ".3gp",
	FileTypeOGV:  ".ogv",
}

func IsSupportedExtension(ext string) bool {
	for _, supportedExt := range SupportedExtensions {
		if ext == supportedExt {
			return true
		}
	}
	return false
}

func GetFileTypeFromExtension(ext string) FileType {
	for ft, supportedExt := range SupportedExtensions {
		if ext == supportedExt {
			return ft
		}
	}

	return -1
}
