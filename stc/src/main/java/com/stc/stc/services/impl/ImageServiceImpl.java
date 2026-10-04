package com.stc.stc.services.impl;

import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.stc.stc.helper.AppConstants;
import com.stc.stc.services.ImageService;

@Service
public class ImageServiceImpl implements ImageService {

    // constructor injection
    private Cloudinary cloudinary;

    public ImageServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public String uploadImage(MultipartFile Image, String filename) {
        // code for-> jo image ko cloud per upload kare
        try {
            byte[] data = new byte[Image.getInputStream().available()];

            // readed stream will be stored in 'data' variable
            Image.getInputStream().read(data);

            // upload to cloud
            cloudinary.uploader().upload(data, ObjectUtils.asMap(
                    "public_id", filename));

            // return -> url of uploaded image
            return this.getUrlFromPublicId(filename);

        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public String getUrlFromPublicId(String publicId) {
        // created URL
        return cloudinary
                .url()
                .transformation(
                        new Transformation<>()
                                .width(AppConstants.CONTACT_IMAGE_WIDTH)
                                .height(AppConstants.CONTACT_IMAGE_HEIGHT)
                                .crop(AppConstants.CONTACT_IMAGE_CROP))
                .generate(publicId);
    }

}
