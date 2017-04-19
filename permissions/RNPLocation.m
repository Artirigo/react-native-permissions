//
//  RNPLocation.m
//  ReactNativePermissions
//
//  Created by Yonah Forst on 11/07/16.
//  Copyright © 2016 Yonah Forst. All rights reserved.
//

#import "RNPLocation.h"
#import <CoreLocation/CoreLocation.h>


@interface RNPLocation() <CLLocationManagerDelegate>
@property (strong, nonatomic) CLLocationManager* locationManager;
@property (copy) void (^completionHandler)(NSString *);
@end

@implementation RNPLocation

static NSString * const LOCATION_BOTH = @"both";
static NSString * const LOCATION_ALWAYS = @"always";
static NSString * const LOCATION_WHEN_IN_USE = @"whenInUse";

// returned status is mapped as following:
// notDetermined 		0
// restricted 			1
// denied 				2
// authorizedAlways		3
// authorizedWhenInUse	4
+ (NSString *)getStatusForType:(NSString *)type
{
    int status = [CLLocationManager authorizationStatus];

    switch (status) {
        case kCLAuthorizationStatusAuthorizedAlways:
            return RNPStatusAuthorized;
        case kCLAuthorizationStatusAuthorizedWhenInUse:
            return [type isEqualToString:LOCATION_ALWAYS] ? RNPStatusDenied : RNPStatusAuthorized;
        case kCLAuthorizationStatusDenied:
            return RNPStatusDenied;
        case kCLAuthorizationStatusRestricted:
            return RNPStatusRestricted;
        default:
            return RNPStatusUndetermined;
    }
}

- (void)request:(NSString*)type completionHandler:(void (^)(NSString *))completionHandler
{
    NSString *status = [RNPLocation getStatusForType:nil];
    if (status == RNPStatusUndetermined) {
        self.completionHandler = completionHandler;
        
        if (self.locationManager == nil) {
            self.locationManager = [[CLLocationManager alloc] init];
            self.locationManager.delegate = self;
        }

        if ([type isEqualToString:LOCATION_ALWAYS] || [type isEqualToString:LOCATION_BOTH]) {
            [self.locationManager requestAlwaysAuthorization];
        }
        if ([type isEqualToString:LOCATION_WHEN_IN_USE] || [type isEqualToString:LOCATION_BOTH]) {
            [self.locationManager requestWhenInUseAuthorization];
        }
    } else {
        if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusAuthorizedWhenInUse && [type isEqualToString:@"always"]) {
            completionHandler(RNPStatusDenied);
        } else {
            completionHandler(status);
        }
    }
}

-(void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status {
    if (status != kCLAuthorizationStatusNotDetermined) {
        if (self.locationManager) {
            self.locationManager.delegate = nil;
            self.locationManager = nil;
        }

        if (self.completionHandler) {
            //for some reason, checking permission right away returns denied. need to wait a tiny bit
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                self.completionHandler([RNPLocation getStatusForType:nil]);
                self.completionHandler = nil;
            });
        }
    }
}
@end
