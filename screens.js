import React, {useRef} from 'react';
import {
    ActionSheetIOS,
    StatusBar,
    Button,
    Image,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    AsyncStorage,
    ActivityIndicator,
    ScrollView,
    Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import {MaterialCommunityIcons} from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import {SafeAreaProvider, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Grid, YAxis} from 'react-native-svg-charts';
import {
    LineChart,
    BarChart,
    PieChart,
    ProgressChart,
    ContributionGraph,
    StackedBarChart
} from "react-native-chart-kit";
import uploadImage from './assets/upload-image.png';
import {FlatList} from "react-native-web";
// import {NativeStack} from "./App";
import {createNativeStackNavigator} from "react-native-screens/native-stack";
import {enableScreens} from "react-native-screens";

enableScreens();
// Function to save data in AsyncStorage
const _storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        // Error saving data
        alert('Error while saving data');
    }
}

// Function to get data from AsyncStorage
const _retrieveData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
            // Our data is fetched successfully
            console.log('_retrieveData return result:');
            console.log(value);
            return value;
        } else {
            console.log('_retrieveData returns NULL:');
            return null;
        }
    } catch (error) {
        // Error retrieving data
        alert('Error while retrieving data')
    }
}

// Function to remove data from AsyncStorage
const _removeItemValue = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
        return true;
    } catch (exception) {
        return false;
    }
}

class MyBarChart extends React.Component {
    constructor(props) {
        super(props);

        let foodType = [];
        let foodValue = []
        for (let food in this.props.dataObject) {
            foodType.push(food);
            foodValue.push(this.props.dataObject[food])
        }
        let maxValueID = foodValue.indexOf(Math.max(...foodValue));
        this.state = {
            foodType: foodType,
            foodValue: foodValue,
            maxValueID: maxValueID
        }
    }

    render() {
        console.log("KEYMAP");
        console.log(this.state.foodType);
        console.log(this.state.foodValue);
        console.log("///////////////////////");

        return (
            <View>
                <Text style={styles.barChartHeader}>{this.state.foodType[this.state.maxValueID]}</Text>
                <LineChart
                    data={{
                        labels: this.state.foodType,
                        datasets: [
                            {
                                data: this.state.foodValue
                            }
                        ]
                    }}
                    width={Dimensions.get("window").width} // from react-native
                    verticalLabelRotation={45}
                    height={320}
                    fromZero={true}
                    yAxisSuffix="%"
                    yAxisInterval={25} // optional, defaults to 1
                    chartConfig={{
                        backgroundColor: "#6C63FF",
                        backgroundGradientFrom: "#6C63FF",
                        backgroundGradientTo: "#6f67e0",
                        decimalPlaces: 0, // optional, defaults to 2dp
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: {
                            borderRadius: 0
                        },
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#6C63FF"
                        }
                    }}
                    bezier
                    style={{
                        marginVertical: 10,
                        borderRadius: 0
                    }}
                />
            </View>
        );
    }
}

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            imageURI: null,
            cameraIsVisible: false,
            cameraPermission: false,
            galleryPermission: false,
            archiveData: null,
            currentFoodData: null,
            renderBarChart: false,
            renderBar: false
        }

        _retrieveData('archiveData')
            .catch(error => {
                alert('Error ' + error);
            }).then(response => {
            console.log('CONSTRUCTOR GOT: ')
            if (response !== null) {
                console.log(response);
                const parsedJSON = JSON.parse(response.toString())
                if (parsedJSON) {
                    this.setState({archiveData: parsedJSON})
                } else {
                    this.setState({archiveData: {}});
                }
            } else {
                console.log('Null, set: {}');
                this.setState({archiveData: {}})
            }
        })
    }

    askPermission = (type) => {
        if (type === "camera") {
            ImagePicker.requestCameraPermissionsAsync().then(permissionResult => {
                if (permissionResult.granted === false) {
                    alert("Permission to access camera roll is required!");
                } else {
                    this.setState({cameraPermission: true});
                }
            })
        } else if (type === "gallery") {
            ImagePicker.requestMediaLibraryPermissionsAsync().then(permissionResult => {
                if (permissionResult.granted === false) {
                    alert("Permission to access camera roll is required!");
                } else {
                    this.setState({galleryPermission: true});
                }
            })
        }
    };

    openCamera = () => {
        if (this.state.cameraPermission === false)
            this.askPermission("camera");

        ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
            base64: true,
            exif: false,
            doNotSave: true
        }).then(image => {
            if (!image.cancelled) {
                this.setState({imageURI: image.uri});
            }
        })
    }


    openGallery = () => {
        if (this.state.galleryPermission === false)
            this.askPermission("gallery");

        ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            base64: true,
            aspect: [4, 3],
            quality: 1,
        }).then(image => {
            if (!image.cancelled) {
                this.setState({imageURI: image.uri});
            }
        })
    }

    uploadImage = () => {
        // alert('showActionSheetWithOptions');
        this.setState({renderBarChart: false});
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Cancel", "Take photo", "Choose from gallery"],
                cancelButtonIndex: 0
            },
            buttonIndex => {
                if (buttonIndex === 0) {
                    // cancel action
                } else if (buttonIndex === 1) {
                    this.openCamera();
                } else if (buttonIndex === 2) {
                    this.openGallery();
                }
            }
        );
    }

    sendRequest = async () => {
        // alert('sendRequest')
        if (this.state.imageURI) {
            ImageManipulator.manipulateAsync(
                this.state.imageURI,
                [{resize: {width: 224, height: 224}}]
            ).then(response => {
                console.log("ImageManipulator.manipulateAsync: ");
                console.log(JSON.stringify(response));
                const resizedImageURI = response.uri;

                if (resizedImageURI) {
                    let start = (new Date()).getTime();
                    let url = "https://057b5aecc333.ngrok.io/analyse"
                    let uploadData = new FormData();
                    uploadData.append('submit', 'ok');
                    uploadData.append('file', {
                        uri: resizedImageURI,
                        type: 'image/jpeg',
                        name: 'photo.jpg',
                    })
                    this.setState({waitingForResponse: true, renderBarChart: false});
                    fetch(url, {
                        method: 'post',
                        body: uploadData
                    }).then(response => response.json())
                        .catch((error) => {
                            alert("ERROR " + error);
                            this.setState({waitingForResponse: false});
                        })
                        .then(response => {
                            if (response) {
                                console.log('//////////////////////////////////////////////////');
                                console.log("NEW RESPONSE");
                                console.log('Response Image New: ' + (((new Date()).getTime() - start) / 1000).toString());
                                console.log(response);
                                this.setState({currentFoodData: response});

                                // Get current archive
                                let curArchiveData = this.state.archiveData;
                                if (curArchiveData !== null) {
                                    console.log('Update storage');
                                    // Add image uri to Object
                                    response['image_uri'] = this.state.imageURI;
                                    const curID = Object.keys(curArchiveData).length;
                                    curArchiveData[curID] = response;

                                    // Save archive to AsyncStorage
                                    _storeData('archiveData', JSON.stringify(curArchiveData));
                                    this.setState({'archiveData': curArchiveData});
                                }
                            }
                            this.setState({waitingForResponse: false, renderBarChart: true});
                        })
                }
            }).catch((error) => {
                    console.log("Error: " + error);
                    alert(error);
                }
            );

        }
    }
    resetValue = () => {
        // alert('resetValue');
        _removeItemValue('archiveData').then(response => {
            if (response) {
                console.log('REMOVED');
            } else {
                console.log('ERROR while remove');
            }
        })
        this.setState({archiveData: null});
    }

    printArchive = () => {
        // alert('printArchive')
        console.log('////////////////////////////////////////////////////////');
        console.log('this.state.archiveData:');
        console.log(this.state.archiveData);
        console.log('');

        _retrieveData('archiveData')
            .catch(error => {
                alert('Error retrieving data')
            }).then(response => {
            console.log('CURRENT _retrieveData');
            console.log(response);
            console.log('');
        })
    }

    render() {
        return (
            <View
                style={styles.safeAreaContainer}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#ecf0f1"/>
                <ScrollView style={{width: '100%'}}>
                    <View style={styles.scrollContainer}>

                        {/*<StatusBar barStyle="dark-content" backgroundColor="#ecf0f1"/>*/}

                        <View style={styles.imagePlaceContainer}>
                            <TouchableOpacity style={styles.imagePlace}
                                              onPress={this.uploadImage}>
                                {!this.state.imageURI &&
                                    <Image source={uploadImage} style={styles.imagePlaceholder} resizeMode='contain'/>
                                }
                                {!this.state.imageURI && <Text style={styles.placeholderText}>Tap to upload an image</Text>}

                                {this.state.imageURI &&
                                <Image source={{uri: this.state.imageURI}} style={styles.imageUploaded}
                                       resizeMode='cover'/>}

                            </TouchableOpacity>
                        </View>
                        {this.state.renderBarChart &&
                        // <MyBarChart dataObject={this.state.currentFoodData.result}/>
                            <MyBarChart dataObject={this.state.currentFoodData.result}/>
                        }
                        <View style={styles.imagePlaceContainer}>
                            {this.state.imageURI &&
                            <TouchableOpacity
                                style={styles.buttonUpload}
                                onPress={this.sendRequest}
                            >
                                {!this.state.waitingForResponse && <Text style={styles.textButton}>Process photo</Text>}
                                {this.state.waitingForResponse && <ActivityIndicator size="small" color="#0000ff"/>}
                            </TouchableOpacity>}
                        </View>



                        {/*<View style={styles.imagePlaceContainer}>*/}
                        {/*    {<TouchableOpacity*/}
                        {/*        style={styles.buttonUpload}*/}
                        {/*        onPress={this.printArchive}*/}
                        {/*    >*/}
                        {/*        <Text style={styles.textButton}>Print Archive</Text>*/}
                        {/*    </TouchableOpacity>}*/}
                        {/*</View>*/}
                        {/*<View style={styles.imagePlaceContainer}>*/}

                        {/*    {<TouchableOpacity*/}
                        {/*        style={styles.buttonUpload}*/}
                        {/*        onPress={this.resetValue}*/}
                        {/*    >*/}
                        {/*        <Text style={styles.textButton}>Remove value</Text>*/}
                        {/*    </TouchableOpacity>}*/}
                        {/*</View>*/}
                    </View>
                </ScrollView>
            </View>
        );
    }

}


const MyBarChart2 = () => {
    const labels = [
        "fats",
        "carbs",
        "appetizer",
        "mains",
        "junk",
        "protein",
        "meat",
        "dessert",
        "healthy",
        "soups",
    ];
    const data = [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
    ];
    let maxValueID = data.indexOf(Math.max(...data));

    return (
        <View style={styles.archiveBarChart}>
            <Text style={styles.barChartHeader}>{labels[maxValueID]}</Text>
            <LineChart
                data={{
                    labels: labels,
                    datasets: [
                        {
                            data: data
                        }
                    ]
                }}
                fromZero={true}
                width={Dimensions.get("window").width} // from react-native
                verticalLabelRotation={42}
                height={320}
                yAxisSuffix="%"
                yAxisInterval={10}
                chartConfig={{
                    backgroundColor: "#6C63FF",
                    backgroundGradientFrom: "#6C63FF",
                    backgroundGradientTo: "#6f67e0",
                    decimalPlaces: 2, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,

                    propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#6C63FF"
                    }
                }}
                bezier
                style={{
                    marginVertical: 8,
                }}
            />
        </View>
    );
};

export const NativeStack = createNativeStackNavigator();

function MyBarChartList() {
    const scrollRef = useRef(null);

    const statusBarInset = useSafeAreaInsets().top;
    const smallHeaderInset = statusBarInset + 44;
    const largeHeaderInset = statusBarInset + 90;
    scrollRef.current?.scrollTo({
        y: -largeHeaderInset,
    })

    return (
        <ScrollView
            ref={scrollRef}
            contentInsetAdjustmentBehavior="automatic"
            scrollToOverflowEnabled
        >
            <MyBarChart2/>
            <MyBarChart2/>
            <MyBarChart2/>
            <MyBarChart2/>
            <MyBarChart2/>
        </ScrollView>
        );

}
class History extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            image: null,
            cameraIsVisible: false,
            cameraPermission: false,
            galleryPermission: false,
        }
    }

    render() {
        return (
                    <NativeStack.Navigator
                        screenOptions={{
                            headerTranslucent: true,
                            headerLargeTitle: true,
                            headerStyle: {backgroundColor: 'rgba(255,255,255, 1)'},
                        }}>
                        <NativeStack.Screen
                            name="Your archive"
                            component={MyBarChartList}
                        />
                    </NativeStack.Navigator>
        );
    }
}


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export class FullView extends React.Component {
    render() {
        return (
            <SafeAreaProvider>
                <NavigationContainer>
                    <StatusBar barStyle="light-content" backgroundColor="#6a51ae"/>

                                <Tab.Navigator
                                    initialRouteName="Home"
                                    tabBarOptions={{
                                        activeTintColor: '#6c63ff'
                                    }}
                                >
                                    <Tab.Screen
                                        name="Home"
                                        component={Home}
                                        options={{
                                            tabBarLabel: 'Home',
                                            tabBarIcon: ({color, size}) => (
                                                <MaterialCommunityIcons name="home" color={color} size={34}/>
                                            ),
                                        }}
                                    />
                                    <Tab.Screen
                                        name="History"
                                        component={History}
                                        options={{
                                            tabBarLabel: 'History',
                                            tabBarIcon: ({color, size}) => (
                                                <MaterialCommunityIcons name="history" color={color} size={34}/>
                                            ),
                                            tabBarBadge: 3
                                        }}
                                    />
                                </Tab.Navigator>

                </NavigationContainer>
            </SafeAreaProvider>
        );
    }
}

const styles = StyleSheet.create({
    safeAreaContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'white',
    },
    scrollContainer: {
        width: '100%',
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'white'
    },
    imagePlaceContainer: {
        display: 'flex',
        flexDirection: 'row',
    },
    imagePlace: {
        backgroundColor: '#f3f3f3',
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#cbcbcb',
        borderBottomWidth: 1,
        // borderRadius: 20,

        // shadowColor: '#000000',
        // shadowOffset: {width: 0, height: 1},
        // shadowOpacity: 0.4,
        // shadowRadius: 3,
        // elevation: 3,
        // marginTop: 20,
        marginBottom: 40
    },
    imagePlaceholder: {
        height: 200,
    },
    imageUploaded: {
        width: "100%",
        height: "100%",
        // borderRadius: 20,
    },
    top: {
        flex: 0.3,
        backgroundColor: "grey",
        borderWidth: 5,
        // borderTopLeftRadius: 20,
        // borderTopRightRadius: 20,
    },
    middle: {
        flex: 0.3,
        backgroundColor: "beige",
        borderWidth: 5,
    },
    buttonUpload: {
        alignItems: "center",
        display: 'flex',
        flexDirection: 'row',
        flex: 0.8,
        height: 50,
        borderRadius: 5,
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: '#2AC062',
        shadowColor: '#2AC062',
        shadowOpacity: 0.4,
        marginBottom: 15,
    },
    textButton: {
        fontSize: 16,
        textTransform: 'uppercase',
        color: '#FFFFFF'
    },
    placeholderText: {
        paddingTop: 50,
        fontSize: 24
    },
    barChartHeader: {
        textAlign: "center",
        fontWeight: "400",
        fontSize: 24,
        textTransform: 'capitalize'
    },
    archiveBarChart: {
        paddingTop: 15,
        paddingBottom: 15,
    }
});
