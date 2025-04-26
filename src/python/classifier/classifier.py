import sys
import json
import os
import logging
import numpy as np
from PIL import Image
from tensorflow.keras.preprocessing import image  # for image.img_to_array
from tensorflow.keras.applications.inception_resnet_v2 import preprocess_input
import tensorflow as tf

# Suppress TensorFlow/Keras logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel(logging.ERROR)

# ----------------- Custom Layer Definition -----------------
class CustomScaleLayer(tf.keras.layers.Layer):
    def __init__(self, scale=1.0, **kwargs):
        """Initialize the layer with an initial scale value."""
        super(CustomScaleLayer, self).__init__(**kwargs)
        self.initial_scale = scale

    def build(self, input_shape):
        self.scale = self.add_weight(
            name='scale',
            shape=(1,),
            initializer=tf.keras.initializers.Constant(self.initial_scale),
            trainable=True
        )
        super(CustomScaleLayer, self).build(input_shape)

    def call(self, inputs):
        return inputs * self.scale

    def get_config(self):
        config = super(CustomScaleLayer, self).get_config()
        config.update({'scale': self.initial_scale})
        return config

# ----------------- Model & Label Loaders -----------------
def load_class_labels():
    with open("src/python/classifier/models/class_labels.json", "r") as f:
        return json.load(f)

def load_brain_model():
    return tf.keras.models.load_model("src/python/classifier/models/best_model.h5")

# We'll load the skin model once and reuse it.
SKIN_MODEL = None
def get_skin_model():
    global SKIN_MODEL
    if SKIN_MODEL is None:
        from tensorflow.keras.models import load_model
        custom_objects = {"CustomScaleLayer": CustomScaleLayer}
        SKIN_MODEL = load_model("src/python/classifier/models/Skin_disease_model.h5", custom_objects=custom_objects)
        # Recompile using the suggested loss function.
        SKIN_MODEL.compile(loss="sparse_categorical_crossentropy", optimizer="adam")
    return SKIN_MODEL

# ----------------- Brain Tumor Functions -----------------
def load_and_preprocess_brain_image(img, target_size=(256, 256)):
    """Convert image to RGB, resize, convert to array, and expand dims for prediction."""
    img = img.convert('RGB')
    img = img.resize(target_size)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def predict_brain_image(model, img, class_labels):
    """Use the brain model to predict the class label and confidence."""
    img_array = load_and_preprocess_brain_image(img)
    prediction = model.predict(img_array, verbose=0)
    predicted_class_index = np.argmax(prediction, axis=1)[0]
    predicted_class_label = class_labels[predicted_class_index]
    return predicted_class_label, float(np.max(prediction))

# ----------------- Skin Disease Functions -----------------
def prepare_skin_image(img_path, target_size=(224, 224)):
    """
    Open the image from the given path, convert it to RGB,
    resize to the target size, convert it to an array, expand dims, and preprocess.
    This normally produces a 4D tensor of shape (batch, height, width, channels).
    """
    img = Image.open(img_path).convert('RGB')
    img = img.resize(target_size)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)  # Expected shape: (1, H, W, C)
    img_array = preprocess_input(img_array)
    return img_array

def force_to_rank4(x):
    """
    If x is a tensor (or numpy array) of rank 5 (i.e. shape (batch, time, H, W, C)),
    force it to rank 4 by taking the first time step:
       new_x = x[:, 0, ...]
    This function works whether x is a tf.Tensor or a numpy array.
    """
    if isinstance(x, tf.Tensor):
        if x.shape.rank == 5:
            x = x[:, 0, ...]
    else:
        # Convert to tensor, slice, and convert back.
        x_tensor = tf.convert_to_tensor(x)
        if x_tensor.shape.rank == 5:
            x_tensor = x_tensor[:, 0, ...]
        x = x_tensor.numpy()
    return x

def predict_skin_image(img_path):
    """
    Prepare the image and make a prediction using the skin model.
    If the input tensor has an extra (time) dimension (rank 5),
    force it to rank 4 by taking the first time step.
    Returns the predicted class index and the prediction array.
    """
    model = get_skin_model()
    img_array = prepare_skin_image(img_path)
    
    # Check if the image array has 5 dimensions; if so, force it to rank 4.
    if img_array.ndim == 5:
        img_array = force_to_rank4(img_array)
    
    predictions = model.predict(img_array, verbose=0)
    class_idx = int(np.argmax(predictions[0]))
    return class_idx, predictions[0]

def predict_skin(img_path):
    """Wrapper returning a formatted result for skin disease."""
    class_idx, prediction_array = predict_skin_image(img_path)
    confidence = float(np.max(prediction_array))
    label = f"Skin Class {class_idx}"  # Replace with a proper mapping if available.
    return {"prediction": label, "confidence": confidence}

# ----------------- Main Entry Point -----------------
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid arguments. Usage: python classifier.py <image_path> <model_type>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    model_type = sys.argv[2].lower()

    try:
        if model_type == "brain":
            model = load_brain_model()
            class_labels = load_class_labels()
            img = Image.open(image_path)
            prediction_label, confidence = predict_brain_image(model, img, class_labels)
            result = {"prediction": prediction_label, "confidence": confidence}
        elif model_type == "skin":
            result = predict_skin(image_path)
        else:
            result = {"error": "Invalid model type. Use 'brain' or 'skin'."}
    except Exception as e:
        result = {"error": str(e)}

    print(json.dumps(result))
