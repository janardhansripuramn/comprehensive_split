import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  X,
  FlipHorizontal,
  Flash,
  FlashOff,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react-native';

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onReceiptScanned: (imageUri: string, extractedData?: any) => void;
}

export default function ReceiptScanner({ visible, onClose, onReceiptScanned }: ReceiptScannerProps) {
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.webNotSupported}>
          <View style={styles.webNotSupportedContent}>
            <Camera size={48} color={colors.textSecondary} />
            <Text style={styles.webNotSupportedText}>
              Camera features are not available on web. Please use the manual entry option.
            </Text>
            <TouchableOpacity style={styles.webCloseButton} onPress={onClose}>
              <Text style={styles.webCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            We need your permission to use the camera for receipt scanning
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const processReceipt = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      // TODO: Implement OCR processing here
      // For now, we'll simulate processing and return the image
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data - in real implementation, this would come from OCR
      const mockExtractedData = {
        merchant: 'Sample Store',
        amount: '25.99',
        date: new Date().toISOString().split('T')[0],
        category: 'Food & Dining',
      };

      onReceiptScanned(capturedImage, mockExtractedData);
      setCapturedImage(null);
      onClose();
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Error', 'Failed to process receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(!flash);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    topControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    controlButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 40,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    captureButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 40,
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    galleryButton: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    galleryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      marginLeft: 8,
    },
    previewContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    previewImage: {
      flex: 1,
      resizeMode: 'contain',
    },
    previewOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    previewControls: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    previewButton: {
      backgroundColor: colors.surface,
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewButtonPrimary: {
      backgroundColor: colors.primary,
    },
    previewButtonText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      marginLeft: 8,
    },
    previewButtonTextPrimary: {
      color: '#FFFFFF',
    },
    processingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontFamily: 'Inter-Medium',
      marginTop: 20,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    permissionText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 30,
    },
    permissionButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 30,
      paddingVertical: 15,
      marginBottom: 15,
    },
    permissionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 30,
      paddingVertical: 15,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    webNotSupported: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    webNotSupportedContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      margin: 20,
    },
    webNotSupportedText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      textAlign: 'center',
      marginVertical: 20,
    },
    webCloseButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    webCloseButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
  });

  if (capturedImage) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.previewButton} onPress={retakePhoto}>
                <Camera size={20} color={colors.text} />
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.previewButton, styles.previewButtonPrimary]} 
                onPress={processReceipt}
                disabled={isProcessing}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.previewButtonTextPrimary}>
                  {isProcessing ? 'Processing...' : 'Use Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Processing receipt...</Text>
            </View>
          )}
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash ? 'on' : 'off'}
        >
          <View style={styles.overlay}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                {flash ? (
                  <Flash size={24} color="#FFFFFF" />
                ) : (
                  <FlashOff size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                <FlipHorizontal size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <Camera size={32} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                <ImageIcon size={20} color="#FFFFFF" />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}